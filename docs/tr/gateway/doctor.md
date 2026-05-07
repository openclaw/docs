---
read_when:
    - doctor geçişleri ekleme veya değiştirme
    - Uyumluluğu bozan yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Tanılama
x-i18n:
    generated_at: "2026-05-07T13:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durumu düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

## Hızlı başlangıç

```bash
openclaw doctor
```

### Başsız ve otomasyon modları

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Sormadan varsayılanları kabul eder (geçerli olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dahil).

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

    İstemler olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirmesi + diskteki durum taşımaları). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

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
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI yeniden oluşturulur).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalleştirmesi.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk yapılandırması geçişi.
    - Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcı olduğunda ancak araç ilkesi hâlâ joker karakter veya Plugin’e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski diskteki durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski ajan runtime ilkesi geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin’ler etkinleştirildiğinde eski Plugin yapılandırması temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları etkisiz kapsama yapılandırması olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş istem-yeniden-yazma dalları için oturum transkripti onarımı.
    - Başlangıcın alt öğeyi yeniden başlatma nedeniyle iptal edilmiş olarak ele almaya devam etmemesi için eski iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteğiyle birlikte takılı kalan alt ajan yeniden başlatma-kurtarma tombstone algılama.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transkriptler, durum dizini).
    - Yerel olarak çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token’ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını raporlar.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor’lar">
    - Sandbox etkinleştirildiğinde sandbox imajı onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway’den yoklanır).
    - Kanala özgü izin denetimleri `openclaw channels capabilities` altında bulunur; örneğin Discord ses kanalı izinleri `openclaw channels capabilities --channel discord --target channel:<channel-id>` ile denetlenir.
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modeller, yedekler, Heartbeat/alt ajan/Compaction geçersiz kılmaları, hook’lar, kanal model geçersiz kılmaları ve oturum rota pin’lerindeki eski `openai-codex/*` model referansları için Codex rota onarımı; `--fix` bunları `openai/*` olarak yeniden yazar ve yalnızca Codex Plugin kurulu, etkin, `codex` harness’ini sağlıyor ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"` seçer. Aksi halde `agentRuntime.id: "pi"` seçer.
    - İsteğe bağlı onarımla supervisor yapılandırma denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında kabuk `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan Gateway hizmetleri için gömülü proxy ortam temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanıları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token oluşturmayı önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-token önbelleği sapması ve eşleştirilmiş kayıt kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve kabuk">
    - Linux’ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosyası boyutu denetimi (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan ajan için Skills hazırlık denetimi; eksik ikili dosyalar, env, yapılandırma veya işletim sistemi gereksinimleri olan izin verilen skills’i raporlar ve `--fix`, kullanılamayan skills’i `skills.entries` içinde devre dışı bırakabilir.
    - Kabuk tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD ikili dosyası).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyuşmazlığı, eksik UI varlıkları, eksik tsx ikili dosyası).
    - Güncellenmiş yapılandırma + sihirbaz metadata’sını yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, temellendirilmiş dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler Gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, temellendirilmiş REM günlük geçişini çalıştırır ve tersine çevrilebilir geri doldurma girişlerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca bu işaretli geri doldurma günlük girişlerini `DREAMS.md` dosyasından kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama veya günlük destek biriktirmemiş, aşamalanmış yalnızca temellendirilmiş kısa vadeli girişleri kaldırır.

Kendiliklerinden yapmadıkları:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce aşamalanmış CLI yolunu açıkça çalıştırmadığınız sürece temellendirilmiş adayları otomatik olarak canlı kısa vadeli terfi deposuna aşamalamazlar

Temellendirilmiş geçmiş yeniden oynatmanın normal derin terfi hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken temellendirilmiş kalıcı adayları kısa vadeli dreaming deposuna aşamalar.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) yapmayı önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirmesi">
    Yapılandırma eski değer biçimleri içeriyorsa (örneğin kanala özgü bir geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Geçerli herkese açık Talk konuşma yapılandırması `talk.provider` + `talk.providers.<provider>` şeklindedir ve gerçek zamanlı ses yapılandırması `talk.realtime.*` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar ve eski üst düzey gerçek zamanlı seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    joker karakter veya Plugin’e ait araç girişleri kullandığında uyarır. `tools.allow: ["*"]` yalnızca gerçekten yüklenen Plugin’lerden gelen araçlarla eşleşir;
    özel Plugin izin listesini atlamaz. Doctor, mevcut paketli sağlayıcı davranışını korumak için geçirilen
    eski izin listesi yapılandırmalarına `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha katı `"allowlist"` ayarını gösterir.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway başlangıcı eski yapılandırma biçimlerini reddeder ve `openclaw doctor --fix` çalıştırmanızı ister; başlangıçta `openclaw.json` dosyasını yeniden yazmaz. Cron iş deposu geçişleri de `openclaw doctor --fix` tarafından işlenir.

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
    - Adlandırılmış `accounts` olan ancak üst düzeyde tek hesaplı kanal değerleri kalan kanallarda, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` değerini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı aktarım ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlatması ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı başarısız olmak yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz bu, `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu durum modelleri yanlış API’ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantı yolunu gösteriyorsa, doctor bunu geçerli ana makine yerel Chrome MCP ekleme modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome’un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144’ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışması
    - bu tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk ekleme onayı istemini onaylama

    Buradaki hazır olma durumu yalnızca yerel ekleme ön koşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu işlemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, remote-browser veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS’ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski aktarım ayarlarını gördüğünde uyarır; böylece eskimiş aktarım geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy’ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor eski `openai-codex/*` model başvurularını denetler. Yerel Codex harness yönlendirmesi kanonik `openai/*` model başvurularını kullanır; OpenAI ajan dönüşleri OpenClaw PI OpenAI yolu yerine Codex uygulama sunucusu harness’ı üzerinden geçer.

    `--fix` / `--repair` modunda doctor; birincil modeller, yedekler, heartbeat/subagent/compaction geçersiz kılmaları, hook’lar, kanal modeli geçersiz kılmaları ve eskimiş kalıcı oturum rota durumu dahil olmak üzere etkilenen varsayılan ajan ve ajan başına başvuruları yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Eşleşen ajan çalışma zamanı yalnızca Codex yüklüyse, etkinse, `codex` harness’ına katkıda bulunuyorsa ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"` olur.
    - Aksi halde eşleşen ajan çalışma zamanı `agentRuntime.id: "pi"` olur.
    - Mevcut model yedek listeleri eski girdileri yeniden yazılarak korunur; kopyalanmış model başına ayarlar eski anahtardan kanonik `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri, auth-profile sabitlemeleri ve Codex harness sabitlemeleri keşfedilen tüm ajan oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor ayrıca yapılandırılmış modelleri veya çalışma zamanını Codex gibi plugin sahipli bir rotadan uzaklaştırdıktan sonra eskimiş otomatik oluşturulmuş rota durumu için keşfedilen ajan oturum depolarını tarar.

    `openclaw doctor --fix`, sahip olan rotaları artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, çalışma zamanı model meta verileri, sabitlenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik auth-profile geçersiz kılmaları gibi otomatik oluşturulmuş eskimiş durumu temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri manuel inceleme için raporlanır ve olduğu gibi bırakılır; bu rota artık amaçlanmadığında bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor, eski disk üzeri düzenleri geçerli yapıya geçirebilir:

    - Oturum deposu + dökümler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotenttir; doctor herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumları + ajan dizinini otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller manuel doctor çalıştırması olmadan ajan başına yola iner. WhatsApp kimlik doğrulaması özellikle yalnızca `openclaw doctor` üzerinden geçirilir. Talk sağlayıcı/sağlayıcı eşlemi normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu yüzden yalnızca anahtar sırasından kaynaklanan farklar artık tekrarlanan işlemsiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için yüklü tüm plugin manifestlerini tarar. Bulunduğunda bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ayrıca zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri için cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) denetler.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak taşır. Bir iş, eski notify yedek davranışını mevcut webhook olmayan bir teslimat moduyla birleştiriyorsa doctor uyarır ve o işi manuel inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çağırıyorsa da uyarır. Bu host'a yerel script, mevcut OpenClaw tarafından bakımı yapılan bir script değildir ve cron systemd kullanıcı veriyoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` mesajları yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel sağlık kontrolleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her agent oturumu dizinini bayat yazma kilidi dosyalarına karşı tarar — bunlar bir oturum anormal biçimde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve bayat sayılıp sayılmadığı (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 prompt transkripti yeniden yazma hatasının oluşturduğu çoğaltılmış dal biçimi için agent oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamı içeren terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı prompt'unu içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece Gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu da yayar).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde transkript dosyaları eksik olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyor).
    - **Birden fazla durum dizini**: ev dizinleri arasında birden fazla `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yere işaret ettiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak host üzerinde çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolması)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar sona ermek üzereyse/süresi dolmuşsa uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili bayatsa bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli (TTY) çalışırken görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini raporlar:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model referansını katalog ve allowlist'e göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox görüntüsü onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker görüntülerini kontrol eder ve mevcut görüntü eksikse eski adlara derlemeyi veya geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş plugin bağımlılığı hazırlama durumunu kaldırır. Bu, bayat oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, önceki paketli plugin bağımlılığı onarım kodundan kalan paket yerel kalıntıları ve mevcut paketli manifesti gölgeleyebilen paketli `@openclaw/*` plugin'lerin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara referans veriyor ancak yerel plugin kayıt defteri bulamıyorsa eksik indirilebilir plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış agent çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlangıcı ve yapılandırma yeniden yüklemesi paket yöneticilerini çalıştırmaz; plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizlik ipuçları">
    Doctor eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırmayı ve OpenClaw hizmetini mevcut gateway portunu kullanarak kurmayı teklif eder. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizlik ipuçları yazdırabilir. Profil adlandırılmış OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta kullanıcı düzeyi gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın veya gateway yaşam döngüsünün sahibi bir sistem supervisor ise `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabının bekleyen veya eyleme geçirilebilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu kontrol tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz id hâlâ eşleşirken cihaz kimliği artık onaylanmış kayıtla eşleşmediğinde açık anahtar uyuşmazlığı onarımları
    - onaylanmış rol için etkin token'ı olmayan eşleştirilmiş kayıtlar
    - kapsamları onaylanmış eşleştirme temel çizgisinin dışına sapan eşleştirilmiş token'lar
    - mevcut makine için gateway tarafı token döndürmesinden daha eski olan veya bayat kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz token girdileri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - bayat kaydı `openclaw devices remove <deviceId>` ile kaldırın ve yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekli alınıyor" açığını kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve bayat token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı allowlist olmadan DM'lere açık olduğunda veya bir politika tehlikeli biçimde yapılandırıldığında uyarılar yayar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, logout sonrasında gateway'in canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, plugin'ler ve eski dizinler)">
    Doctor, varsayılan agent için çalışma alanı durumunun özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve allowlist tarafından engellenmiş skills sayısını sayar.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri mevcut çalışma alanının yanında bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı plugin'leri sayar; hatalar için plugin ID'lerini listeler; paket plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: mevcut çalışma zamanı ile uyumluluk sorunları olan plugin'leri işaretler.
    - **Plugin tanılamaları**: plugin kayıt defteri tarafından yayılan yükleme zamanı uyarılarını veya hatalarını yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilmiş bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya üzerinde olup olmadığını kontrol eder. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir oranı olarak toplam enjekte edilmiş karakterleri raporlar. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını ince ayarlamak için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Bayat kanal plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal plugin'ini kaldırdığında, o plugin'e referans veren sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın gateway'den hâlâ ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor, geçerli shell için sekme tamamlamanın kurulu olup olmadığını kontrol eder (zsh, bash, fish veya PowerShell):

    - Shell profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor kurulumu ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği manuel olarak yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama kontrolleri (yerel token)">
    Doctor, yerel gateway token kimlik doğrulama hazırlığını kontrol eder.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef duyarlı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı hata verme davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix`, artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabilir olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot belirteci SecretRef aracılığıyla yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökmek veya belirteci eksik olarak yanlış raporlamak yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve Gateway sağlıksız göründüğünde yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek arama hazırlığı">
    Doctor, yapılandırılmış bellek arama gömme sağlayıcısının varsayılan ajan için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve elle ikili yolu seçeneği dahil düzeltme yönergeleri yazdırır.
    - **Açık yerel sağlayıcı**: Yerel model dosyası veya tanınan uzak/indirilebilir model URL'si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): Ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: Önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu kullanılabilir olduğunda (denetim sırasında Gateway sağlıklıydı), doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz karşılaştırır ve tutarsızlıkları not eder. Doctor varsayılan yolda yeni bir gömme pingi başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında gömme hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle uyarıları raporlar.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar için denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyuşmazlık bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor'ı salt okunur tutar. Hizmet sağlığını raporlamaya ve hizmet dışı onarımları çalıştırmaya devam eder, ancak hizmet yükleme/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazımları ve eski hizmet temizliğini atlar; çünkü bu yaşam döngüsünün sahibi dış bir supervisor'dır.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkinken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan, eski olmayan, Gateway benzeri ek birimleri yok sayar; böylece eşlik eden hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef yönetimindeyse, doctor hizmet yükleme/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içinde gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse, doctor yükleme/onarım yolunu uygulanabilir yönergelerle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar yükleme/onarımı engeller.
    - Linux kullanıcı systemd birimleri için doctor belirteç sapması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olup gerçekte çalışmadığında uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) raporlar.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun veya sürüm yönetimli bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları, hizmet kabuk başlatmanızı yüklemediği için yükseltmelerden sonra bozulabilir. Doctor, kullanılabilir olduğunda bir sistem Node kurulumuna geçiş yapmayı önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'ları, etkileşimli kabuk PATH'ini kopyalamak yerine kanonik bir sistem PATH'i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri, Node alt süreçlerinin hangisini çözümlediğini değiştirmez. Linux hizmetleri açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı ikili dizinlerini tutmaya devam eder, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz meta verileri">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) hakkında tam kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
