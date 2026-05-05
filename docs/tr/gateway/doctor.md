---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Geriye dönük uyumsuz yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-05T01:46:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski config/durum verilerini düzeltir, sağlık denetimleri yapar ve uygulanabilir onarım adımları sağlar.

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

    Sormadan önerilen onarımları uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

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

    Sorma olmadan çalışır ve yalnızca güvenli geçişleri uygular (config normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön hazırlık güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeni olduğunda Control UI'ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve plugin durumu.

  </Accordion>
  <Accordion title="Config ve geçişler">
    - Eski değerler için config normalleştirme.
    - Talk config geçişi: eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına.
    - Eski Chrome extension config dosyaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşul denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya plugin sahipli araçlar istediğinde plugin/araç izin listesi uyarıları.
    - Eski disk üzerindeki durum geçişi (oturumlar/agent dizini/WhatsApp auth).
    - Eski plugin manifest contract anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` webhook fallback işleri).
    - Eski agent runtime-policy geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkinken eski plugin config temizliği; `plugins.enabled=false` olduğunda eski plugin referansları etkisiz kapsama config olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemelerinin oluşturduğu yinelenmiş prompt-rewrite dalları için oturum transcript onarımı.
    - Takılmış subagent yeniden başlatma-kurtarma tombstone algılama; başlangıcın alt süreci yeniden başlatma nedeniyle iptal edilmiş saymaya devam etmemesi için eski iptal edilmiş kurtarma bayraklarını temizlemede `--fix` desteği.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, durum dizini).
    - Yerel çalıştırmada config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını bildirir.
    - Ek workspace dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor'lar">
    - Sandbox etkin olduğunda sandbox imaj onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durumu uyarıları (çalışan Gateway'den yoklanır).
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan Gateway hizmetleri için gömülü proxy ortam temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node ve Bun, version-manager yolları).
    - Gateway port çakışması tanıları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef config dosyalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token önbelleği sapması ve eşleştirilmiş kayıt auth sapması).

  </Accordion>
  <Accordion title="Workspace ve shell">
    - Linux'ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Varsayılan agent için Skills hazırlık denetimi; eksik binary, env, config veya OS gereksinimleri olan izinli skills öğelerini bildirir ve `--fix`, kullanılamayan skills öğelerini `skills.entries` içinde devre dışı bırakabilir.
    - Shell tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm workspace uyumsuzluğu, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş config + sihirbaz metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded Dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler Gateway doctor tarzı RPC yöntemleri kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Backfill**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir backfill girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca bu işaretlenmiş backfill günlük girdilerini `DREAMS.md` dosyasından kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı geri çağırma veya günlük destek biriktirmemiş aşamalanmış yalnızca grounded kısa vadeli girdileri kaldırır.

Kendi başlarına ne **yapmazlar**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce aşamalanmış CLI yolunu açıkça çalıştırmadığınız sürece grounded adayları canlı kısa vadeli yükseltme deposuna otomatik olarak aşamalamazlar

Grounded geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded dayanıklı adayları kısa vadeli Dreaming deposuna aşamalar.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalleştirme">
    Config eski değer biçimleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları dahildir. Geçerli genel Talk config yapısı `talk.provider` + `talk.providers.<provider>` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi joker karakter
    veya plugin sahipli araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen plugin'lerden gelen araçlarla eşleşir; özel plugin
    izin listesini atlamaz. Doctor, mevcut bundled sağlayıcı davranışını korumak için geçirilmiş
    eski izin listesi config dosyalarına `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha katı `"allowlist"` ayarına işaret eder.

  </Accordion>
  <Accordion title="2. Eski config anahtarı geçişleri">
    Config kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway de eski bir config biçimi algıladığında başlangıçta doctor geçişlerini otomatik olarak çalıştırır; böylece eski config dosyaları manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından işlenir.

    Geçerli geçişler:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - görünür yanıt ilkesi eksik yapılandırılmış kanal yapılandırmaları → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Adlandırılmış `accounts` bulunan ancak tek hesaplı üst düzey kanal değerleri kalan kanallarda, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski Plugin aktarıcı ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri kapalı başarısız olmak yerine gelecekteki veya bilinmeyen enum değerine ayarlanmış sağlayıcıları atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap-varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor uyarır; böylece geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilirsiniz.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome eklentisi yolunu gösteriyorsa, doctor bunu geçerli ana bilgisayar-yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana bilgisayar-yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana bilgisayarda yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144 altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana bilgisayar-yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana bilgisayarında Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerel olarak çalışması
    - bu tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk bağlanma onayı isteminin onaylanması

    Buradaki hazırlık yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, remote-browser veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski aktarım ayarlarını gördüğünde uyarır; böylece eski aktarım geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex Plugin rota uyarıları">
    Paketlenen Codex Plugin etkinleştirildiğinde, doctor `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözülüp çözülmediğini de denetler. Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden istediğinizde bu birleşim geçerlidir, ancak yerel Codex app-server harness ile karıştırılması kolaydır. Doctor uyarır ve açık app-server biçimine işaret eder: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI şu anlama gelir: "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulamasını kullan."
    - `openai/*` + `agentRuntime.id: "codex"` şu anlama gelir: "gömülü turu yerel Codex app-server üzerinden çalıştır."
    - `/codex ...` şu anlama gelir: "sohbetten yerel bir Codex konuşmasını denetle veya bağla."
    - `/acp ...` veya `runtime: "acp"` şu anlama gelir: "harici ACP/acpx adaptörünü kullan."

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth bilinçli olarak kullanılıyorsa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="2g. Oturum rota temizliği">
    Doctor ayrıca yapılandırılmış varsayılan/yedek modeli veya çalışma zamanını Codex gibi Plugin sahibi bir rotadan uzaklaştırdıktan sonra etkin oturum deposunu eski otomatik oluşturulmuş rota durumu için tarar.

    `openclaw doctor --fix`, sahip rota artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, çalışma zamanı model meta verileri, sabitlenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik auth-profile geçersiz kılmaları gibi otomatik oluşturulmuş eski durumu temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri manuel inceleme için raporlanır ve dokunulmadan bırakılır; o rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk yerleşimi)">
    Doctor, daha eski disk üzeri yerleşimleri geçerli yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Agent dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotenttir; doctor herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumlar + agent dizinini otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller manuel doctor çalıştırması olmadan agent başına yola yerleşir. WhatsApp kimlik doğrulaması bilinçli olarak yalnızca `openclaw doctor` aracılığıyla geçirilir. Talk sağlayıcı/sağlayıcı eşlemesi normalleştirmesi artık yapısal eşitlikle karşılaştırır; bu nedenle yalnızca anahtar sırası farkları artık tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tüm yüklü Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veri yinelenmeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron depo geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından denetler.

    Geçerli cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik geçirir. Bir iş eski notify yedeğini mevcut webhook dışı teslim moduyla birleştirirse, doctor uyarır ve o işi manuel inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çağırdığında da uyarır. Bu ana makineye yerel betik, mevcut OpenClaw tarafından bakımda değildir ve cron systemd kullanıcı veri yoluna ulaşamadığında `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` iletileri yazabilir. Güncel olmayan crontab girdisini `crontab -e` ile kaldırın; güncel sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her agent oturum dizinini eski yazma kilidi dosyaları için tarar; bunlar bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ çalışıp çalışmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan daha eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi takdirde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkripti dal onarımı">
    Doctor, 2026.4.24 prompt transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için agent oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı prompt'unu içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala göre yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka bir yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmanızı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (ve sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyumsuzluğu**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyor).
    - **Birden çok durum dizini**: ev dizinleri arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri işaret ettiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, onu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` olarak sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth sona ermesi)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar sona ermek üzereyken/sona erdiğinde uyarır ve güvenliyse bunları yenileyebilir. Anthropic OAuth/token profili eskiyse bir Anthropic API anahtarı veya Anthropic kurulum token'ı yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerektiğini raporlar ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini de raporlar:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu katalog ve allowlist'e göre doğrular ve çözümlenmediğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandboxing etkin olduğunda doctor, Docker imajlarını denetler ve mevcut imaj eksikse eski adlara geçmeyi veya derlemeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, daha önceki paketlenmiş Plugin bağımlılığı onarım kodundan kalan paket-yerel kalıntıları ve mevcut paketlenmiş manifesti gölgeleyebilen paketlenmiş `@openclaw/*` Plugin'lerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvuruyor ancak yerel Plugin kayıt defteri bunları bulamıyorsa eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış agent çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor, eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway bağlantı noktasını kullanarak OpenClaw hizmetini kurmayı teklif eder. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlandırmalı OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi gateway hizmeti eksik ancak sistem düzeyi OpenClaw gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yinelemeyi kaldırın veya bir sistem yöneticisi gateway yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda), geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifrelenmiş durum hazırlığı. İki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleştiği ancak cihaz kimliği artık onaylanmış kayıtla eşleşmediği genel anahtar uyumsuzluğu onarımları
    - onaylanmış bir rol için etkin token'ı eksik olan eşleştirilmiş kayıtlar
    - kapsamları onaylanmış eşleştirme temel çizgisinin dışına sapan eşleştirilmiş token'lar
    - geçerli makine için gateway tarafı token rotasyonundan önce gelen veya eski kapsam meta verileri taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor, eşleştirme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekli alınıyor" açığını kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırt eder.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı allowlist olmadan DM'lere açık olduğunda veya bir ilke tehlikeli şekilde yapılandırıldığında uyarılar üretir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, gateway'in çıkıştan sonra canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve allowlist tarafından engellenmiş skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: geçerli çalışma alanının yanında `~/openclaw` veya başka eski çalışma alanı dizinleri bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yükleme zamanında üretilen uyarıları veya hataları yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya bunun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir oranı olarak toplam enjekte edilmiş karakterleri raporlar. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını ince ayarlamak için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın hâlâ gateway'in ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor kurmayı ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel gateway token kimlik doğrulama hazır oluşunu denetler.

    - Token modu bir token gerektiriyor ve hiçbir token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve onu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token` yalnızca hiçbir token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkındalıklı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedeflenmiş yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token’ı SecretRef aracılığıyla yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve token’ın eksik olduğunu hatalı bildirmek veya çökmek yerine otomatik çözümü atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve sağlıksız göründüğünde gateway’i yeniden başlatmayı teklif eder.
  </Accordion>
  <Accordion title="13b. Bellek arama hazırlığı">
    Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan agent için hazır olup olmadığını denetler. Davranış, yapılandırılmış backend’e ve sağlayıcıya bağlıdır:

    - **QMD backend**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili yolu seçeneği dahil düzeltme rehberi yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan uzak/indirilebilir model URL’si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir gateway yoklama sonucu mevcut olduğunda (gateway denetim anında sağlıklıydı), doctor bu sonucu CLI’dan görülebilen yapılandırmayla karşılaştırır ve herhangi bir tutarsızlığı not eder. Doctor varsayılan yolda yeni bir embedding ping’i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, yüklü supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya eski varsayılanlar açısından denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve servis dosyasını/görevini geçerli varsayılanlara göre yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes` varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair` önerilen düzeltmeleri istem olmadan uygular.
    - `openclaw doctor --repair --force` özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway servis yaşam döngüsü için doctor’ı salt okunur tutar. Servis sağlığını yine bildirir ve servis dışı onarımları çalıştırır, ancak harici bir supervisor bu yaşam döngüsünün sahibi olduğu için servis install/start/restart/bootstrap, supervisor yapılandırma yeniden yazımları ve eski servis temizliğini atlar.
    - Linux’ta doctor, eşleşen systemd Gateway birimi etkinken komut/entrypoint metadata’sını yeniden yazmaz. Ayrıca yinelenen servis taraması sırasında etkin olmayan, legacy olmayan ek gateway benzeri birimleri yok sayar; böylece eşlik eden servis dosyaları temizlik gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor servis install/repair işlemi SecretRef’i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor servis ortam metadata’sına kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Zamanlanmış Görev kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli servis ortam değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için servis metadata’sını yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` sabitlediğini algılar ve servis metadata’sını geçerli porta göre yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef’i çözümlenmemişse, doctor install/repair yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar install/repair işlemini engeller.
    - Linux user-systemd birimleri için doctor token sapması denetimleri artık servis kimlik doğrulama metadata’sını karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor servis çalışma zamanını (PID, son çıkış durumu) inceler ve servis yüklü olduğu halde gerçekten çalışmadığında uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway servisi Bun üzerinde veya sürümle yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü servis shell başlangıcınızı yüklemez. Doctor, mevcut olduğunda sistem Node kurulumuna geçiş yapmayı teklif eder (Homebrew/apt/choco).

    Yeni yüklenen veya onarılan macOS LaunchAgent’ları, etkileşimli shell PATH’ini kopyalamak yerine standart bir sistem PATH’i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node child process’lerinin çözümleneceğini değiştirmez. Linux servisleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı user-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi fallback dizinleri yalnızca bu dizinler diskte mevcutsa servis PATH’ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + wizard metadata’sı">
    Doctor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için wizard metadata’sını damgalar.
  </Accordion>
  <Accordion title="19. Workspace ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir workspace bellek sistemi önerir ve workspace zaten git altında değilse bir yedekleme ipucu yazdırır.

    Workspace yapısı ve git yedekleme için tam rehber için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace) (önerilen özel GitHub veya GitLab).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
