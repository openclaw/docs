---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Geriye dönük uyumluluğu bozan yapılandırma değişiklikleri getirme
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Tanılama
x-i18n:
    generated_at: "2026-05-06T17:55:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski config/durum verilerini düzeltir, sağlık denetimi yapar ve uygulanabilir onarım adımları sağlar.

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

    Önerilen onarımları sormadan uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Agresif onarımları da uygular (özel supervisor config’lerinin üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Sormadan çalışır ve yalnızca güvenli geçişleri uygular (config normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/servis/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem servislerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI’ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config and migrations">
    - Eski değerler için config normalleştirme.
    - Talk config geçişi: eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına.
    - Eski Chrome extension config’leri ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode provider override uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşul denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker veya plugin’e ait araçlar istediğinde Plugin/araç allowlist uyarıları.
    - Eski disk üzeri durum geçişi (oturumlar/agent dizini/WhatsApp auth).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron depolama geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski agent runtime-policy geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin’ler etkin olduğunda eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları inert containment config olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="State and integrity">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-rewrite dalları için oturum transkripti onarımı.
    - Sıkışmış subagent yeniden başlatma-kurtarma tombstone algılama; eski iptal edilmiş kurtarma bayraklarını temizlemek için `--fix` desteğiyle, başlangıcın child’ı yeniden başlatma-iptal edilmiş olarak ele almaya devam etmesini önler.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transkriptler, durum dizini).
    - Yerel çalışırken config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token’ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını raporlar.
    - Ek workspace dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Sandbox etkinleştirildiğinde sandbox image onarımı.
    - Eski servis geçişi ve ek gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway üzerinden yoklanır).
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modeller, fallback’ler, Heartbeat/subagent/Compaction override’ları, hook’lar, kanal model override’ları ve oturum route pin’lerindeki eski `openai-codex/*` model referansları için Codex route onarımı; `--fix` bunları `openai/*` olarak yeniden yazar ve yalnızca Codex Plugin kuruluysa, etkinse, `codex` harness’ını sağlıyorsa ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"` seçer. Aksi halde `agentRuntime.id: "pi"` seçer.
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış Gateway servisleri için gömülü proxy ortam temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node ve Bun, version-manager yolları).
    - Gateway port çakışması tanılama (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token oluşturmayı önerir; token SecretRef config’lerinin üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token önbelleği drift’i ve paired-record auth drift’i).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux’ta systemd linger denetimi.
    - Workspace bootstrap dosyası boyutu denetimi (context dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan agent için Skills hazırlık denetimi; eksik binary, env, config veya işletim sistemi gereksinimleri olan izinli skill’leri raporlar ve `--fix`, kullanılamayan skill’leri `skills.entries` içinde devre dışı bırakabilir.
    - Shell completion durum denetimi ve otomatik kurulum/yükseltme.
    - Memory arama embedding provider hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm workspace uyuşmazlığı, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş config + wizard metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemleri kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Backfill**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM diary geçişini çalıştırır ve geri alınabilir backfill girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca bu işaretlenmiş backfill diary girdilerini `DREAMS.md` içinden kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz live recall veya günlük destek biriktirmemiş staged grounded-only kısa vadeli girdileri kaldırır.

Tek başlarına ne **yapmazlar**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce staged CLI yolunu açıkça çalıştırmadığınız sürece grounded adayları otomatik olarak canlı kısa vadeli promotion store’a stage etmezler

Grounded geçmiş yeniden oynatmanın normal deep promotion hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, grounded kalıcı adayları kısa vadeli dreaming store’a stage ederken `DREAMS.md` dosyasını inceleme yüzeyi olarak tutar.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalization">
    Config eski değer şekilleri içeriyorsa (örneğin kanala özgü override olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları dahildir. Geçerli public Talk speech config’i `talk.provider` + `talk.providers.<provider>`, realtime voice config’i ise `talk.realtime.*` biçimindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini provider map’e yeniden yazar ve eski üst düzey realtime seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş değilken ve araç ilkesi joker veya Plugin’e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca gerçekten yüklenen Plugin’lerden gelen araçlarla eşleşir; özel Plugin allowlist’ini atlamaz. Doctor, mevcut bundled provider davranışını korumak için geçirilmiş eski allowlist config’lerine `plugins.bundledDiscovery: "compat"` yazar ve ardından daha katı `"allowlist"` ayarına işaret eder.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Config kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway başlangıcı eski config biçimlerini reddeder ve `openclaw doctor --fix` çalıştırmanızı ister; başlangıçta `openclaw.json` dosyasını yeniden yazmaz. Cron iş deposu geçişleri de `openclaw doctor --fix` tarafından işlenir.

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
    - Adlandırılmış `accounts` öğelerine sahip ancak tek hesaplı üst düzey kanal değerleri kalmış kanallar için, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (araçlar/yükseltilmiş/çalıştırma/sandbox/alt ajanlar)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı aktarma ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlatması ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı hataya düşmek yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` ya da `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğelerini elle eklediyseniz, bu `@mariozechner/pi-ai` üzerinden gelen yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API’ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor uyarır; böylece geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilirsiniz.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Tarayıcı yapılandırmanız hâlâ kaldırılan Chrome uzantısı yolunu gösteriyorsa, doctor bunu geçerli ana makine-yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine-yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlantı profilleri için Google Chrome’un aynı ana makinede yüklü olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144 altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine-yerel Chrome MCP hâlâ şunları gerektirir:

    - Gateway/Node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk bağlanma onayı isteminin onaylanması

    Buradaki hazırlık yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, uzak tarayıcı veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özel düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS’ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece eskimiş taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy’ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor eski `openai-codex/*` model referanslarını kontrol eder. Yerel Codex harness yönlendirmesi, dönüşün OpenClaw PI OpenAI yolu yerine Codex uygulama sunucusu harness’ı üzerinden geçmesi için standart `openai/*` model referanslarını ve `agentRuntime.id: "codex"` kullanır.

    `--fix` / `--repair` modunda doctor, birincil modeller, yedekler, Heartbeat/alt ajan/Compaction geçersiz kılmaları, hook’lar, kanal model geçersiz kılmaları ve eskimiş kalıcı oturum rota durumu dahil olmak üzere etkilenen varsayılan ajan ve ajan başına referansları yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Eşleşen ajan runtime’ı yalnızca Codex yüklüyse, etkinse, `codex` harness’ını sağlıyorsa ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"` olur.
    - Aksi takdirde eşleşen ajan runtime’ı `agentRuntime.id: "pi"` olur.
    - Mevcut model yedek listeleri eski girdileri yeniden yazılmış olarak korunur; kopyalanmış model başına ayarlar eski anahtardan standart `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri, kimlik doğrulama profili sabitlemeleri ve Codex harness sabitlemeleri keşfedilen tüm ajan oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx adaptörünü kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor, yapılandırılmış modelleri veya runtime’ı Codex gibi Plugin sahipli bir rotadan uzaklaştırdıktan sonra eskimiş otomatik oluşturulmuş rota durumu için keşfedilen ajan oturum depolarını da tarar.

    `openclaw doctor --fix`, sahip rota artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, runtime model meta verileri, sabitlenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik kimlik doğrulama profili geçersiz kılmaları gibi otomatik oluşturulmuş eskimiş durumları temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri elle inceleme için raporlanır ve dokunulmadan bırakılır; o rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor, eski disk üstü düzenleri geçerli yapıya taşıyabilir:

    - Oturum deposu + dökümler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla yapılır ve idempotenttir; doctor, herhangi bir eski klasörü yedek olarak bıraktığında uyarı yayımlar. Gateway/CLI başlangıçta eski oturumları ve ajan dizinini de otomatik taşır; böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması bilinçli olarak yalnızca `openclaw doctor` üzerinden taşınır. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitliğe göre karşılaştırır, bu nedenle yalnızca anahtar sırası farkları artık tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için yüklü tüm Plugin manifestlerini tarar. Bulduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json`, geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından kontrol eder.

    Geçerli cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → açık `delivery.mode="webhook"` ve `delivery.to=cron.webhook`

    Doctor, `notify: true` işleri yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak geçirir. Bir iş eski notify geri dönüşünü mevcut webhook olmayan bir teslimat moduyla birleştiriyorsa, doctor uyarır ve bu işi manuel incelemeye bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hala eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çağırıyorsa da uyarır. Bu ana makineye yerel betik, mevcut OpenClaw tarafından sürdürülmez ve cron systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına hatalı `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizleme">
    Doctor, bayat yazma kilidi dosyaları için her aracı oturum dizinini tarar — bunlar bir oturum anormal biçimde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hala canlı olup olmadığı, kilit yaşı ve bayat sayılıp sayılmadığı (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik olarak kaldırır; aksi takdirde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transcript dalı onarımı">
    Doctor, 2026.4.24 istem transcript yeniden yazma hatasının oluşturduğu yinelenmiş dal şekli için aracı oturum JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transcript'i etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu da verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerinden kaçınmak için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transcript uyuşmazlığı**: son oturum girdilerinde eksik transcript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transcript yalnızca bir satıra sahipse işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ev dizinleri arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolma)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar süresi dolmak üzereyken/süresi dolduğunda uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili bayatsa, Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulama gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini de bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hook model doğrulaması">
    `hooks.gmail.model` ayarlıysa doctor, model referansını katalog ve izin listesine göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker imajlarını denetler ve geçerli imaj eksikse eski adlara geçmeyi veya derlemeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, bayat oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, önceki paketli Plugin bağımlılık onarım kodundan kalan paket-yerel kalıntıları ve geçerli paketli manifest'i gölgeleyebilen paketli `@openclaw/*` Plugin'lerinin yetim veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvurduğunda ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış aracı çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hala kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/kurulum/güncelleme işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor, eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp OpenClaw hizmetini geçerli Gateway bağlantı noktasını kullanarak kurmayı teklif eder. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

    Linux'ta kullanıcı düzeyi Gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw Gateway hizmeti varsa, doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın veya Gateway yaşam döngüsünü bir sistem gözetmeni yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya eyleme geçirilebilir bir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleme istekleri
    - zaten eşlenmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşlenmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hala eşleşirken cihaz kimliğinin onaylanmış kayıtla artık eşleşmediği açık anahtar uyuşmazlığı onarımları
    - onaylanmış bir rol için etkin token'ı eksik olan eşlenmiş kayıtlar
    - kapsamları onaylanmış eşleme temel çizgisinin dışına sapan eşlenmiş token'lar
    - geçerli makine için Gateway tarafı token döndürmesinden önce gelen veya bayat kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz token girdileri

    Doctor eşleme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - bayat bir kaydı `openclaw devices remove <deviceId>` ile kaldırın ve yeniden onaylayın

    Bu, yaygın "zaten eşlenmiş ama hala eşleme gerekli alıyor" boşluğunu kapatır: doctor artık ilk kez eşlemeyi bekleyen rol/kapsam yükseltmelerinden ve bayat token/cihaz kimliği sapmasından ayırt eder.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir ilke tehlikeli bir şekilde yapılandırıldığında uyarılar verir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bir systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway'in oturum kapatıldıktan sonra canlı kalması için lingering'in etkinleştirildiğinden emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan aracı için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş Skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanının yanında bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanıyla uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayılan yükleme zamanı uyarılarını veya hatalarını yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya onun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilen karakter sayılarını, kısaltma yüzdesini, kısaltma nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir kesri olarak toplam enjekte edilen karakterleri bildirir. Dosyalar kısaltıldığında veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Bayat kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın hala Gateway'den ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa, doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse, doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa, doctor kurmayı sorar (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği manuel olarak yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel Gateway token kimlik doğrulama hazırlığını denetler.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa, doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa, doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkındalıklı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı hata verme davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot belirteci SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve belirteç eksikmiş gibi çöklemek veya yanlış raporlamak yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve Gateway sağlıksız göründüğünde yeniden başlatmayı teklif eder.
  </Accordion>
  <Accordion title="13b. Bellek araması hazır olma durumu">
    Doctor, yapılandırılmış bellek araması gömme sağlayıcısının varsayılan aracı için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve elle ikili yolu seçeneği dahil düzeltme kılavuzu yazdırır.
    - **Açık yerel sağlayıcı**: yerel bir model dosyasını veya tanınan bir uzak/indirilebilir model URL'sini denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage`, vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarının bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (denetim sırasında Gateway sağlıklıydı), doctor bu sonucu CLI tarafından görülebilen yapılandırmayla çapraz karşılaştırır ve varsa tutarsızlıkları belirtir. Doctor varsayılan yolda yeni bir gömme ping'i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında gömme hazır olma durumunu doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları raporlar.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya eski varsayılanlar için denetler (örn. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri sormadan uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor'ı salt okunur tutar. Hizmet sağlığını raporlamaya ve hizmet dışı onarımları çalıştırmaya devam eder, ancak hizmet kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazımları ve eski hizmet temizliğini atlar çünkü bu yaşam döngüsünün sahibi harici bir supervisor'dır.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkinken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar; böylece eşlik eden hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Zamanlanmış Görev kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse, doctor kurulum/onarım yolunu uygulanabilir kılavuzla engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor belirteç sapması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazıldıysa eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Tam yeniden yazmayı her zaman `openclaw gateway install --force` ile zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanıları">
    Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekten çalışmadığında uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf`, vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet kabuk başlatmanızı yüklemez. Doctor, mevcut olduğunda sistem Node kurulumuna geçmeyi teklif eder (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'ları, etkileşimli kabuk PATH'ini kopyalamak yerine kurallı bir sistem PATH'i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node alt süreçlerinin çözümleneceğini değiştirmez. Linux hizmetleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcutsa hizmet PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doctor tüm yapılandırma değişikliklerini kalıcılaştırır ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi için tam kılavuz olarak [/concepts/agent-workspace](/tr/concepts/agent-workspace) bölümüne bakın (önerilen özel GitHub veya GitLab).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
