---
read_when:
    - doctor geçişleri ekleme veya değiştirme
    - Geriye dönük uyumluluğu bozan yapılandırma değişikliklerini tanıtma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-12T08:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski config/state verilerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Varsayılanları sormadan kabul eder (uygulanabildiğinde yeniden başlatma/hizmet/sandbox onarım adımları dahil).

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

    Sormadan çalışır ve yalnızca güvenli geçişleri uygular (config normalizasyonu + disk üzerindeki state taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski state geçişleri algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön denetim güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI’ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config ve geçişler">
    - Eski değerler için config normalizasyonu.
    - Talk config geçişi: eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine.
    - Eski Chrome uzantısı config dosyaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken araç politikası hâlâ wildcard veya Plugin sahipli araçlar istediğinde Plugin/araç allowlist uyarıları.
    - Eski disk üzeri state geçişi (sessions/agent dir/WhatsApp auth).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski Cron store geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` Webhook fallback işleri).
    - Eski tüm-agent runtime-policy temizliği; provider/model runtime policy etkin rota seçicidir.
    - Plugin’ler etkin olduğunda eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları etkisiz containment config olarak değerlendirilir ve korunur.

  </Accordion>
  <Accordion title="State ve bütünlük">
    - Session kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-rewrite dalları için session transcript onarımı.
    - Takılmış subagent yeniden başlatma-kurtarma tombstone algılaması; eski iptal edilmiş kurtarma bayraklarını temizlemek için `--fix` desteğiyle, başlangıcın child öğeyi yeniden başlatma-iptal edilmiş gibi ele almaya devam etmesini önler.
    - State bütünlüğü ve izin denetimleri (sessions, transcripts, state dir).
    - Yerelde çalışırken config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token’ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını raporlar.
    - Ek workspace dir algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor’lar">
    - Sandbox etkin olduğunda sandbox image onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanal eski state geçişi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway’den yoklanır).
    - Kanala özgü izin denetimleri `openclaw channels capabilities` altında bulunur; örneğin Discord voice channel izinleri `openclaw channels capabilities --channel discord --target channel:<channel-id>` ile denetlenir.
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modellerde, fallback’lerde, heartbeat/subagent/compaction geçersiz kılmalarında, hook’larda, kanal model geçersiz kılmalarında ve session rota pin’lerinde eski `openai-codex/*` model ref’leri için Codex rota onarımı; `--fix` bunları `openai/*` olarak yeniden yazar, eski session/tüm-agent runtime pin’lerini kaldırır ve kanonik OpenAI agent ref’lerini varsayılan Codex harness üzerinde bırakır.
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan Gateway hizmetleri için gömülü proxy ortam temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node ve Bun, version-manager yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve eşleştirme">
    - Açık DM politikaları için güvenlik uyarıları.
    - Local token modu için Gateway auth denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef config dosyalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılaması (bekleyen ilk kez eşleştirme istekleri, bekleyen role/scope yükseltmeleri, eski yerel device-token cache drift’i ve paired-record auth drift’i).

  </Accordion>
  <Accordion title="Workspace ve shell">
    - Linux’ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (context dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Varsayılan agent için Skills hazırlık denetimi; eksik bin, env, config veya OS gereksinimleri olan izinli Skills’i raporlar ve `--fix`, kullanılamayan Skills’i `skills.entries` içinde devre dışı bırakabilir.
    - Shell tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Memory arama embedding sağlayıcı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm workspace uyuşmazlığı, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş config + wizard metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Geri doldur**, **Sıfırla** ve **Grounded temizle** eylemlerini içerir. Bu eylemler Gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Yaptıkları:

- **Geri doldur**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, `DREAMS.md` içinden yalnızca işaretlenmiş geri doldurma günlük girdilerini kaldırır.
- **Grounded temizle**, yalnızca geçmiş tekrar oynatmadan gelen ve henüz canlı recall veya günlük destek biriktirmemiş staged grounded-only short-term girdilerini kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- staged CLI yolunu açıkça önce çalıştırmadığınız sürece grounded adayları canlı short-term promotion store içine otomatik olarak stage etmezler

Grounded geçmiş tekrar oynatmanın normal derin promotion lane’i etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded durable adayları short-term dreaming store içine stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalizasyonu">
    Config eski değer biçimleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları dahildir. Geçerli genel Talk speech config `talk.provider` + `talk.providers.<provider>` şeklindedir ve realtime voice config `talk.realtime.*` içindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini provider map içine yeniden yazar ve eski üst düzey realtime seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç politikası wildcard
    veya Plugin sahipli araç girdileri kullandığında uyarır. `tools.allow: ["*"]`, yalnızca
    gerçekten yüklenen Plugin’lerden gelen araçlarla eşleşir; özel Plugin
    allowlist’i atlamaz. Doctor, geçirilmiş eski allowlist config dosyaları için mevcut paketli sağlayıcı davranışını korumak üzere
    `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha sıkı `"allowlist"` ayarına işaret eder.

  </Accordion>
  <Accordion title="2. Eski config anahtarı geçişleri">
    Config kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway başlangıcı eski config biçimlerini reddeder ve `openclaw doctor --fix` çalıştırmanızı ister; başlangıçta `openclaw.json` dosyasını yeniden yazmaz. Cron job store geçişleri de `openclaw doctor --fix` tarafından işlenir.

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
    - Adlandırılmış `accounts` içeren ancak tek hesaplı üst düzey kanal değerleri kalan kanallarda, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı aktarma ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı hata vermek yerine atlar)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` öğesini kaldırın; Codex app-server, Codex’e özgü çalışma alanı araçlarını her zaman yerel tutar

    Doctor uyarıları çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor geri dönüş yönlendirmesinin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap ID’sine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap ID’lerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@earendil-works/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API’ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Browser geçişi ve Chrome MCP hazırlığı">
    Browser yapılandırmanız hala kaldırılmış Chrome uzantı yolunu gösteriyorsa, doctor bunu mevcut ana makine yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlantı profilleri için Google Chrome’un aynı ana makinede kurulu olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144’ün altındaysa uyarır
    - browser inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP yine şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir browser
    - browser’ın yerel olarak çalışması
    - o browser’da uzaktan hata ayıklamanın etkinleştirilmiş olması
    - browser’daki ilk bağlanma onay isteminin onaylanması

    Buradaki hazırlık yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir browser veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, remote-browser veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS’ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/geri dönüş davranışını geri alabilirsiniz. Özel proxy’ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex rota onarımı">
    Doctor eski `openai-codex/*` model başvurularını kontrol eder. Yerel Codex harness yönlendirmesi kanonik `openai/*` model başvurularını kullanır; OpenAI ajan dönüşleri OpenClaw PI OpenAI yolu yerine Codex app-server harness üzerinden gider.

    `--fix` / `--repair` modunda doctor, birincil modeller, geri dönüşler, heartbeat/subagent/compaction geçersiz kılmaları, hooks, kanal model geçersiz kılmaları ve bayat kalıcı oturum rota durumu dahil etkilenen varsayılan ajan ve ajan başına başvuruları yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Codex amacı, onarılan ajan model başvuruları için sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşınır; böylece model başvurusu `openai/*` olduktan sonra da `openai-codex:...` auth profilleri seçilebilir.
    - Çalışma zamanı seçimi sağlayıcı/model kapsamlı olduğu için bayat tüm ajan çalışma zamanı yapılandırması ve kalıcı oturum çalışma zamanı sabitlemeleri kaldırılır.
    - Onarılan eski model başvurusunun eski auth yolunu korumak için Codex yönlendirmesine ihtiyacı olmadığı sürece mevcut sağlayıcı/model çalışma zamanı ilkesi korunur.
    - Mevcut model geri dönüş listeleri, eski girdileri yeniden yazılmış halde korunur; kopyalanmış model başına ayarlar eski anahtardan kanonik `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, geri dönüş bildirimleri ve auth profili sabitlemeleri keşfedilen tüm ajan oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını kontrol et veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx adaptörünü kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Oturum rota temizliği">
    Doctor, yapılandırılmış modelleri veya çalışma zamanını Codex gibi Plugin sahipli bir rotadan uzaklaştırdıktan sonra bayat otomatik oluşturulmuş rota durumu için keşfedilen ajan oturum depolarını da tarar.

    `openclaw doctor --fix`, sahip oldukları rota artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, çalışma zamanı model meta verileri, sabitlenmiş harness ID’leri, CLI oturum bağlamaları ve otomatik auth profili geçersiz kılmaları gibi otomatik oluşturulmuş bayat durumu temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri elle inceleme için raporlanır ve dokunulmadan bırakılır; o rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor eski disk üzeri düzenleri mevcut yapıya geçirebilir:

    - Oturum deposu + transcript’ler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp auth durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap ID’si: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotent’tir; doctor, yedek olarak herhangi bir eski klasör bıraktığında uyarı yayar. Gateway/CLI, geçmiş/auth/modellerin elle doctor çalıştırmadan ajan başına yola inmesi için başlangıçta eski oturumları + ajan dizinini de otomatik geçirir. WhatsApp auth bilinçli olarak yalnızca `openclaw doctor` ile geçirilir. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır; bu nedenle yalnızca anahtar sırası farkları artık tekrar eden no-op `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tüm kurulu Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotent’tir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`), zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri açısından kontrol eder.

    Mevcut cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslimat alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslimat takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak taşır. Bir iş, eski notify yedeğini mevcut webhook olmayan bir teslimat moduyla birleştiriyorsa doctor uyarır ve bu işi manuel inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'i hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çağırdığında da uyarır. Bu ana makineye yerel betik güncel OpenClaw tarafından bakımı yapılmaz ve cron systemd kullanıcı veri yoluna ulaşamadığında `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel sağlık kontrolleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturum dizinini eski yazma kilidi dosyaları için tarar — bir oturum anormal şekilde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID, 30 dakikadan eski veya OpenClaw dışı bir sürece ait olduğu kanıtlanabilen canlı PID). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkripti dal onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için ajan oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı dönüşü ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen dönüşler görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: felaket niteliğinde durum kaybı konusunda uyarır, dizini yeniden oluşturmayı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları sırasında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: yakın tarihli oturum girdilerinde transkript dosyaları eksik olduğunda uyarır.
    - **Ana oturum "1 satırlı JSONL"**: ana transkript yalnızca bir satır içerdiğinde işaretler (geçmiş birikmiyor).
    - **Birden çok durum dizini**: ev dizinleri arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir olduğunda uyarır ve `600` değerine sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolması)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar sona ermek üzereyken veya sona ermişken uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili eskiyse Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalıştırıldığında (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hook model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model referansını katalog ve izin listesine göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox görüntü onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker görüntülerini kontrol eder ve geçerli görüntü eksikse eski adlara oluşturmayı veya geçmeyi önerir.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, önceki paketli Plugin bağımlılığı onarım kodundan kalan paket yerel artıklarını ve geçerli paketli manifesti gölgeleyebilen artık veya kurtarılmış yönetilen npm paketli `@openclaw/*` Plugin kopyalarını kapsar. Doctor ayrıca ana makine `openclaw` paketini `peerDependencies.openclaw` bildiren yönetilen npm Plugin'lerine yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket yerel çalışma zamanı içe aktarmaları güncellemelerden veya npm onarımlarından sonra çözümlenmeye devam eder.

    Doctor, yapılandırma bunlara referans verdiğinde ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış ajan çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizlik ipuçları">
    Doctor, eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırmayı ve geçerli gateway bağlantı noktasını kullanarak OpenClaw hizmetini kurmayı önerir. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizlik ipuçları yazdırabilir. Profil adlı OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta kullanıcı düzeyi gateway hizmeti eksik ancak sistem düzeyi bir OpenClaw gateway hizmeti mevcutsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın veya gateway yaşam döngüsüne bir sistem denetleyicisi sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabının bekleyen veya eyleme dönüştürülebilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlatma devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu kontrol tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleştiği halde cihaz kimliği onaylı kayıtla artık eşleşmediğinde genel anahtar uyuşmazlığı onarımları
    - onaylı bir rol için etkin token'ı olmayan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme taban çizgisinin dışına kayan eşleştirilmiş token'lar
    - geçerli makine için gateway tarafı token rotasyonundan önce gelen veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz token girdileri

    Doctor, eşleştirme isteklerini otomatik olarak onaylamaz veya cihaz token'larını otomatik olarak döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırın ve yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekiyor" açığını kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir politika tehlikeli bir şekilde yapılandırıldığında uyarılar verir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, çıkıştan sonra gateway'in canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanıyla birlikte bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanıyla uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayımlanan yükleme zamanı uyarılarını veya hatalarını gösterir.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya üzerinde olup olmadığını kontrol eder. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir oranı olarak bildirir. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını ayarlamak için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e referans veren askıda kalmış kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın gateway'den hâlâ ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk için (zsh, bash, fish veya PowerShell) sekme tamamlamanın kurulu olup olmadığını kontrol eder:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa, doctor bunu daha hızlı önbelleğe alınmış dosya çeşidine yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse, doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa, doctor bunu yüklemeyi önerir (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` komutunu çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama kontrolleri (yerel belirteç)">
    Doctor, yerel Gateway belirteç kimlik doğrulama hazırlığını kontrol eder.

    - Belirteç modu bir belirteç gerektiriyorsa ve hiçbir belirteç kaynağı yoksa, doctor bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa, doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir belirteç SecretRef'i yapılandırılmamışsa oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef duyarlı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabilir olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot belirteci SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ancak-kullanılamaz olduğunu bildirir ve kilitlenmek ya da belirteci eksik olarak yanlış bildirmek yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık kontrolü + yeniden başlatma">
    Doctor bir sağlık kontrolü çalıştırır ve Gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması gömme sağlayıcısının varsayılan ajan için hazır olup olmadığını kontrol eder. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin mevcut ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve elle ikili dosya yolu seçeneği dahil düzeltme rehberi yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan uzak/indirilebilir model URL'si olup olmadığını kontrol eder. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini kontrol eder, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (kontrol sırasında Gateway sağlıklıydı), doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz başvurur ve herhangi bir tutarsızlığı not eder. Doctor, varsayılan yolda yeni bir gömme ping'i başlatmaz; canlı sağlayıcı kontrolü istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında gömme hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, yüklü supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya eski varsayılanlar için kontrol eder (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda, güncelleme önerir ve servis dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem olmadan uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway servis yaşam döngüsü için doctor'ı salt okunur tutar. Yine de servis sağlığını bildirir ve servis dışı onarımları çalıştırır, ancak bu yaşam döngüsünün sahibi harici bir supervisor olduğu için servis yükleme/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazmaları ve eski servis temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkin durumdayken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca, yardımcı servis dosyalarının temizleme gürültüsü oluşturmaması için yinelenen servis taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor servis yükleme/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor servis ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içi gömdüğü yönetilen `.env`/SecretRef destekli servis ortamı değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için servis meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` sabitlediğini algılar ve servis meta verilerini geçerli porta yeniden yazar.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse, doctor yükleme/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar yüklemeyi/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor belirteç sapması kontrolleri artık servis kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazıldıysa eski bir OpenClaw ikilisinden gelen bir Gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor servis çalışma zamanını (PID, son çıkış durumu) inceler ve servis yüklü olmasına rağmen fiilen çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) bildirir.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway servisi Bun üzerinde veya sürümle yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve servis kabuk başlatmanızı yüklemediği için sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir. Doctor, kullanılabilir olduğunda sistem Node kurulumuna geçmeyi önerir (Homebrew/apt/choco).

    Yeni yüklenen veya onarılan macOS LaunchAgent'ları, etkileşimli kabuk PATH'ini kopyalamak yerine standart bir sistem PATH'i (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Homebrew tarafından yönetilen sistem ikilileri kullanılabilir kalırken Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri, hangi Node alt süreçlerinin çözümlendiğini değiştirmez. Linux servisleri yine açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda servis PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi için tam kılavuz (önerilen özel GitHub veya GitLab) olarak [/concepts/agent-workspace](/tr/concepts/agent-workspace) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
