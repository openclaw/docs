---
read_when:
    - doctor geçişleri ekleme veya değiştirme
    - Geriye dönük uyumsuz yapılandırma değişiklikleri yapma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-05T08:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durum verilerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul eder (uygulanabildiğinde yeniden başlatma/hizmet/sandbox onarım adımları dahil).

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

    İstemler olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirmesi + diskteki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız, önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - git kurulumları için isteğe bağlı ön kontrol güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI yeniden derlenir).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalleştirmesi.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk yapılandırması geçişi.
    - Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazır olma durumu için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya Plugin sahipli araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski diskteki durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski ajan çalışma zamanı ilkesi geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin’ler etkin olduğunda eski Plugin yapılandırması temizliği; `plugins.enabled=false` olduğunda eski Plugin başvuruları inert kapsama yapılandırması olarak değerlendirilir ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-yeniden-yazma dalları için oturum transkripti onarımı.
    - Sıkışmış alt ajan yeniden başlatma-kurtarma tombstone algılama; başlangıcın çocuğu yeniden başlatma-iptal edilmiş olarak değerlendirmeye devam etmemesi için eski iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteğiyle.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transkriptler, durum dizini).
    - Yerel olarak çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token’ları yenileyebilir ve auth-profile bekleme süresi/devre dışı durumlarını bildirir.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor’lar">
    - Sandbox etkin olduğunda sandbox imajı onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan gateway’den yoklanır).
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - İsteğe bağlı onarımla supervisor yapılandırma denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış gateway hizmetleri için gömülü proxy ortamı temizliği.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
    - Gateway bağlantı noktası çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-token önbelleği sapması ve eşleştirilmiş kayıt kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve shell">
    - Linux’ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Varsayılan ajan için Skills hazır olma denetimi; eksik binary, env, config veya işletim sistemi gereksinimleri olan izinli skills’i bildirir ve `--fix`, kullanılamayan skills’i `skills.entries` içinde devre dışı bırakabilir.
    - Shell tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazır olma denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş yapılandırmayı + sihirbaz metaverisini yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, temellendirilmiş Dreaming iş akışı için **Geri doldur**, **Sıfırla** ve **Temellendirilmişi Temizle** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Yaptıkları:

- **Geri doldur**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, temellendirilmiş REM günlük geçişini çalıştırır ve tersine çevrilebilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca bu işaretlenmiş geri doldurma günlük girdilerini `DREAMS.md` içinden kaldırır.
- **Temellendirilmişi Temizle**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama veya günlük destek biriktirmemiş aşamalanmış yalnızca-temellendirilmiş kısa vadeli girdileri kaldırır.

Kendi başlarına yapmadıkları:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce aşamalanmış CLI yolunu açıkça çalıştırmadığınız sürece temellendirilmiş adayları otomatik olarak canlı kısa vadeli yükseltme deposuna aşamalamazlar

Temellendirilmiş geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız, bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını gözden geçirme yüzeyi olarak tutarken temellendirilmiş kalıcı adayları kısa vadeli Dreaming deposuna aşamalar.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirmesi">
    Yapılandırma eski değer şekilleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Geçerli herkese açık Talk yapılandırması `talk.provider` + `talk.providers.<provider>` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı haritasına yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi joker karakter
    veya Plugin sahipli araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca gerçekten
    yüklenen Plugin’lerden gelen araçlarla eşleşir; özel Plugin
    izin listesini atlatmaz. Doctor, mevcut paketli sağlayıcı davranışını korumak için taşınmış
    eski izin listesi yapılandırmalarına `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha katı `"allowlist"` ayarına işaret eder.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanım dışı anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway ayrıca eski bir yapılandırma biçimi algıladığında başlangıçta doctor geçişlerini otomatik çalıştırır, böylece eski yapılandırmalar manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından işlenir.

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
    - adlandırılmış `accounts` öğelerine sahip ancak tek hesaplı üst düzey kanal değerleri kalan kanallarda, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı aktarım ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlatması, `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı hata vermek yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılırsa, doctor yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanırsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazır olma durumu">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantı yolunu gösteriyorsa, doctor bunu güncel ana makine yerel Chrome MCP ekleme modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede kurulu olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP yine de şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerel olarak çalışması
    - o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmesi
    - tarayıcıdaki ilk ekleme onay isteminin onaylanması

    Buradaki hazır olma durumu yalnızca yerel ekleme ön koşullarıyla ilgilidir. Existing-session, mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar yine de yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, remote-browser veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` komutudur. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex plugin rota uyarıları">
    Paketlenmiş Codex plugin etkinleştirildiğinde, doctor `openai-codex/*` birincil model referanslarının hâlâ varsayılan PI çalıştırıcısı üzerinden çözümlenip çözümlenmediğini de denetler. PI üzerinden Codex OAuth/abonelik kimlik doğrulaması istediğinizde bu birleşim geçerlidir, ancak bunu yerel Codex uygulama sunucusu donanımıyla karıştırmak kolaydır. Doctor uyarır ve açık uygulama sunucusu biçimine işaret eder: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Her iki rota da geçerli olduğu için doctor bunu otomatik onarmaz:

    - `openai-codex/*` + PI, "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulamasını kullan" anlamına gelir.
    - `openai/*` + `agentRuntime.id: "codex"`, "gömülü turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth bilinçli olarak kullanılıyorsa uyarıyı olduğu gibi tutun.

  </Accordion>
  <Accordion title="2g. Oturum rotası temizliği">
    Doctor ayrıca yapılandırılmış varsayılan/yedek modeli veya runtime'ı Codex gibi plugin sahipli bir rotadan uzaklaştırdıktan sonra bayat otomatik oluşturulmuş rota durumu için etkin oturumlar deposunu tarar.

    `openclaw doctor --fix`, sahip oldukları rota artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, runtime model meta verileri, sabitlenmiş donanım kimlikleri, CLI oturum bağlamaları ve otomatik auth-profile geçersiz kılmaları gibi otomatik oluşturulmuş bayat durumları temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri elle inceleme için raporlanır ve dokunulmadan bırakılır; o rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, daha eski disk üzeri düzenleri güncel yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotenttir; doctor yedek olarak herhangi bir eski klasörü geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumları + ajan dizinini otomatik geçirir; böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması bilinçli olarak yalnızca `openclaw doctor` üzerinden geçirilir. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu yüzden yalnızca anahtar sırasından kaynaklanan farklar artık yinelenen etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için kurulu tüm plugin manifestlerini tarar. Bulduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından denetler.

    Güncel cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik geçirir. Bir iş eski bildirim yedeğini mevcut webhook dışı teslim modu ile birleştirirse, doctor uyarır ve o işi elle inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'i hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` dosyasını çağırıyorsa da uyarır. Bu ana makineye yerel betik mevcut OpenClaw tarafından korunmaz ve Cron systemd kullanıcı veriyoluna ulaşamadığında `~/.openclaw/logs/whatsapp-health.log` içine hatalı `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; mevcut sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor, eski yazma kilidi dosyaları için her ajan oturumu dizinini tarar — bunlar bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor, 2026.4.24 istem transkript yeniden yazma hatasının oluşturduğu yinelenmiş dal şekli için ajan oturumu JSONL dosyalarını tarar: OpenClaw iç çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı sırası ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgün dosyanın yanına yedekler ve transkripti etkin dala yeniden yazar; böylece Gateway geçmişi ve bellek okuyucuları artık yinelenmiş sıralar görmez.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu verir).
    - **macOS bulut eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır, çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır, çünkü SD veya eMMC destekli rastgele G/Ç oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyumsuzluğu**: son oturum girdilerinde transkript dosyaları eksik olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ev dizinleri arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod anımsatması**: `gateway.mode=remote` ise doctor, onu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar süresi dolmak üzereyken/süresi dolduğunda uyarır ve güvenliyse onları yenileyebilir. Anthropic OAuth/token profili eskiyse bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalıştırıldığında (TTY) görünür; `--non-interactive` yenileme girişimlerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulaması gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa soğuma süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu katalog ve izin listesine karşı doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    Sandbox etkinleştirildiğinde doctor, Docker imajlarını denetler ve mevcut imaj eksikse eski adlara geçmeyi veya derlemeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılık hazırlama durumunu kaldırır. Bu; eski oluşturulmuş bağımlılık köklerini, eski install-stage dizinlerini, daha önceki paketli Plugin bağımlılık onarım kodundan kalan paket yerel kalıntılarını ve mevcut paketli manifesti gölgeleyebilen paketli `@openclaw/*` Plugin'lerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvuruyorsa ancak yerel Plugin kayıt defteri bunları bulamıyorsa eksik indirilebilir Plugin'leri de yeniden yükleyebilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış ajan çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor, eski Gateway servislerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp mevcut Gateway bağlantı noktasını kullanarak OpenClaw servisini yüklemeyi teklif eder. Ayrıca ek Gateway benzeri servisler için tarama yapabilir ve temizlik ipuçları yazdırabilir. Profil adlı OpenClaw Gateway servisleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi Gateway servisi eksikse ancak sistem düzeyi bir OpenClaw Gateway servisi varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi servis yüklemez. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin; ardından yineleneni kaldırın veya bir sistem denetçisi Gateway yaşam döngüsünü yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifrelenmiş durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlatma devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdiği şeyler:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliğinin hâlâ eşleştiği ancak cihaz kimliğinin onaylı kayıtla artık eşleşmediği genel anahtar uyumsuzluğu onarımları
    - onaylı bir rol için etkin token'ı eksik eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temel çizgisinin dışına kayan eşleştirilmiş token'lar
    - geçerli makine için Gateway tarafı token döndürmesinden önceye ait olan veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekli uyarısı alınıyor" açığını kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz-kimliği kaymasından ayırır.

  </Accordion>
  <Accordion title="9. Security warnings">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir ilke tehlikeli şekilde yapılandırıldığında uyarılar yayar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bir systemd kullanıcı servisi olarak çalışıyorsa doctor, Gateway oturum kapatıldıktan sonra canlı kalsın diye kalıcılığın etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Doctor, varsayılan ajan için çalışma alanı durumunun özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş skill'leri sayar.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri mevcut çalışma alanının yanında bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: mevcut çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defterinin yaydığı yükleme zamanı uyarılarını veya hatalarını yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir kesri olarak toplam enjekte edilmiş karakterleri bildirir. Dosyalar kesildiğinde veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın Gateway'den hâlâ ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın yüklenip yüklenmediğini denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor yüklemeyi ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway auth checks (local token)">
    Doctor, yerel Gateway token kimlik doğrulama hazır oluşunu denetler.

    - Token modu bir token gerektiriyorsa ve hiçbir token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve onu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token` yalnızca hiçbir token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Read-only SecretRef-aware repairs">
    Bazı onarım akışlarının, çalışma zamanı hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token’ı SecretRef üzerinden yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökmek ya da token’ı eksik olarak yanlış raporlamak yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve gateway sağlıksız göründüğünde yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek arama hazır olma durumu">
    Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan agent için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili dosya yolu seçeneği dahil düzeltme yönergeleri yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan uzak/indirilebilir model URL’si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (Gateway denetim sırasında sağlıklıydı), doctor bu sonucu CLI tarafından görülebilen yapılandırmayla çapraz kontrol eder ve tutarsızlık varsa belirtir. Doctor varsayılan yolda yeni bir embedding ping’i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazır olma durumunu doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa doctor kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar açısından denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevini geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri onay istemeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor’ı salt okunur tutar. Hizmet sağlığını yine bildirir ve hizmet dışı onarımları çalıştırır, ancak harici bir supervisor bu yaşam döngüsüne sahip olduğu için hizmet kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazımları ve eski hizmet temizliğini atlar.
    - Linux’ta doctor, eşleşen systemd Gateway birimi etkinken komut/entrypoint meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan, eski olmayan ek Gateway benzeri birimleri yok sayar; böylece eşlik eden hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Token auth token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef’i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve hizmet meta verilerini bu değerler supervisor tanımı yerine çalışma zamanı kaynağından yüklenecek şekilde yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Token auth token gerektiriyorsa ve yapılandırılmış token SecretRef’i çözümlenemiyorsa doctor, kurulum/onarım yolunu uygulanabilir yönergelerle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa doctor, mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor token drift denetimleri artık hizmet auth meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekte çalışmadığında uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet shell başlatmanızı yüklemez. Doctor mevcut olduğunda sistem Node kurulumuna (Homebrew/apt/choco) geçiş yapmayı önerir.

    Yeni kurulan veya onarılan macOS LaunchAgent’ları, etkileşimli shell PATH’ini kopyalamak yerine kanonik bir sistem PATH’i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node alt süreçlerinin çözümleneceğini değiştirmez. Linux hizmetleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcutsa hizmet PATH’ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + wizard meta verileri">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için wizard meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) hakkında tam kılavuz için [/concepts/agent-workspace](/tr/concepts/agent-workspace) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook’u](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
