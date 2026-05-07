---
read_when:
    - doctor geçişlerini ekleme veya değiştirme
    - Geriye dönük uyumsuz yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-07T01:52:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + migrasyon aracıdır. Eski config/state verilerini düzeltir, sağlık denetimi yapar ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul eder (geçerliyse yeniden başlatma/servis/sandbox onarım adımları dahil).

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

    Agresif onarımları da uygular (özel supervisor config'lerinin üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    İstem göstermeden çalışır ve yalnızca güvenli migrasyonları uygular (config normalizasyonu + diskteki state taşımaları). İnsan onayı gerektiren yeniden başlatma/servis/sandbox eylemlerini atlar. Eski state migrasyonları algılandığında otomatik olarak çalışır.

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
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön kontrol güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeni olduğunda Control UI'ı yeniden oluşturur).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config ve migrasyonlar">
    - Eski değerler için config normalizasyonu.
    - Talk config migrasyonu: eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına geçiş.
    - Eski Chrome extension config'leri ve Chrome MCP hazırlığı için tarayıcı migrasyon denetimleri.
    - OpenCode sağlayıcı override uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ wildcard veya Plugin'e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski diskteki state migrasyonu (sessions/agent dizini/WhatsApp auth).
    - Eski Plugin manifest contract anahtarı migrasyonu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron store migrasyonu (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook fallback işleri).
    - Eski agent runtime-policy migrasyonu: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkinleştirildiğinde eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları etkisiz containment config olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="State ve bütünlük">
    - Session lock dosyası incelemesi ve eski lock temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-rewrite dalları için session transcript onarımı.
    - Yeniden başlatma kurtarmasında takılmış subagent tombstone algılama; startup'ın child'ı yeniden başlatma sırasında iptal edilmiş olarak işlemeyi sürdürmemesi için eski iptal edilmiş recovery flag'lerini temizleyen `--fix` desteğiyle.
    - State bütünlüğü ve izin denetimleri (sessions, transcripts, state dizini).
    - Yerelde çalışırken config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını bildirir.
    - Ek workspace dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servisler ve supervisor'lar">
    - Sandbox etkinleştirildiğinde sandbox image onarımı.
    - Eski servis migrasyonu ve ek gateway algılama.
    - Matrix kanalı eski state migrasyonu (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan gateway'den yoklanır).
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modeller, fallback'ler, heartbeat/subagent/compaction override'ları, hooks, kanal model override'ları ve session route pin'lerindeki eski `openai-codex/*` model referansları için Codex route onarımı; `--fix` bunları `openai/*` olarak yeniden yazar ve yalnızca Codex Plugin kuruluysa, etkinse, `codex` harness'ına katkı sağlıyorsa ve kullanılabilir OAuth'a sahipse `agentRuntime.id: "codex"` seçer. Aksi halde `agentRuntime.id: "pi"` seçer.
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan gateway servisleri için gömülü proxy ortam temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node ve Bun, version-manager yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve pairing">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef config'lerinin üzerine yazmaz).
    - Cihaz pairing sorun algılama (bekleyen ilk kez pair istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token önbelleği sapması ve paired-record auth sapması).

  </Accordion>
  <Accordion title="Workspace ve shell">
    - Linux'ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (context dosyaları için kırpılma/sınıra yakın uyarıları).
    - Varsayılan agent için Skills hazırlık denetimi; eksik bin, env, config veya işletim sistemi gereksinimleri olan izinli skills'leri raporlar ve `--fix`, kullanılamayan skills'leri `skills.entries` içinde devre dışı bırakabilir.
    - Shell completion durum denetimi ve otomatik kurulum/yükseltme.
    - Memory search embedding sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Source kurulum denetimleri (pnpm workspace uyumsuzluğu, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş config + wizard metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/migrasyonunun parçası **değildir**.

Yaptıkları:

- **Backfill**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM diary geçişini çalıştırır ve geri alınabilir backfill girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca bu işaretli backfill diary girdilerini `DREAMS.md` dosyasından kaldırır.
- **Clear Grounded**, yalnızca geçmiş replay'den gelen ve henüz canlı recall veya günlük destek biriktirmemiş staged grounded-only kısa vadeli girdileri kaldırır.

Kendiliğinden **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor migrasyonlarını çalıştırmazlar
- staged CLI yolunu önce açıkça çalıştırmadığınız sürece grounded adayları canlı kısa vadeli promotion store içine otomatik olarak stage etmezler

Grounded geçmiş replay'in normal deep promotion lane'i etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded dayanıklı adayları kısa vadeli dreaming store içine stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalizasyonu">
    Config eski değer biçimleri içeriyorsa (örneğin kanala özgü override olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Geçerli genel Talk speech config'i `talk.provider` + `talk.providers.<provider>` şeklindedir ve realtime voice config'i `talk.realtime.*` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar ve eski üst düzey realtime seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    wildcard veya Plugin'e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    izin listesini atlamaz. Doctor, taşınmış eski izin listesi config'leri için mevcut bundled sağlayıcı davranışını korumak üzere
    `plugins.bundledDiscovery: "compat"` yazar ve ardından daha sıkı
    `"allowlist"` ayarına işaret eder.

  </Accordion>
  <Accordion title="2. Eski config anahtarı migrasyonları">
    Config kullanım dışı anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı migrasyonu gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway startup, eski config formatlarını reddeder ve `openclaw doctor --fix` çalıştırmanızı ister; startup sırasında `openclaw.json` dosyasını yeniden yazmaz. Cron job store migrasyonları da `openclaw doctor --fix` tarafından ele alınır.

    Geçerli migrasyonlar:

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
    - Adlandırılmış `accounts` içeren ancak tek hesaplı üst düzey kanal değerleri kalmış kanallarda, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski eklenti relay ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı hata vermek yerine atlar)

    Doctor uyarıları çok hesaplı kanallar için hesap-varsayılanı yönergelerini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu mevcut ana makineye yerel Chrome MCP ekleme modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makineye yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede kurulu olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makineye yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışması
    - bu tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk ekleme onayı isteminin onaylanması

    Buradaki hazırlık yalnızca yerel ekleme ön koşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, remote-browser veya diğer headless akışlar için **geçerli değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini denetlemek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özel düzeltme yönergeleri yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar daha yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex rota onarımı">
    Doctor eski `openai-codex/*` model başvurularını kontrol eder. Yerel Codex harness yönlendirmesi, dönüşün OpenClaw PI OpenAI yolu yerine Codex app-server harness üzerinden geçmesi için kanonik `openai/*` model başvurularını ve `agentRuntime.id: "codex"` kullanır.

    `--fix` / `--repair` modunda doctor, birincil modeller, yedekler, Heartbeat/subagent/Compaction geçersiz kılmaları, hook'lar, kanal modeli geçersiz kılmaları ve bayat kalıcı oturum rota durumu dahil olmak üzere etkilenen varsayılan ajan ve ajan başına başvuruları yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Eşleşen ajan runtime'ı yalnızca Codex kuruluysa, etkinse, `codex` harness sağlıyorsa ve kullanılabilir OAuth'a sahipse `agentRuntime.id: "codex"` olur.
    - Aksi takdirde eşleşen ajan runtime'ı `agentRuntime.id: "pi"` olur.
    - Mevcut model yedek listeleri, eski girdileri yeniden yazılmış şekilde korunur; kopyalanmış model başına ayarlar eski anahtardan kanonik `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri, auth-profile sabitlemeleri ve Codex harness sabitlemeleri keşfedilen tüm ajan oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Oturum rota temizliği">
    Doctor ayrıca, yapılandırılmış modelleri veya runtime'ı Codex gibi Plugin sahipli bir rotadan uzağa taşımanızdan sonra bayat otomatik oluşturulmuş rota durumu için keşfedilen ajan oturum depolarını tarar.

    `openclaw doctor --fix`, sahip rotaları artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, runtime model meta verileri, sabitlenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik auth-profile geçersiz kılmaları gibi otomatik oluşturulmuş bayat durumu temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri elle inceleme için raporlanır ve dokunulmadan bırakılır; bu rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk yerleşimi)">
    Doctor eski disk üzeri yerleşimleri mevcut yapıya geçirebilir:

    - Oturum deposu + dökümler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla ve idempotent şekilde yapılır; doctor eski klasörleri yedek olarak geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumlar + ajan dizinini otomatik olarak geçirir, böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` üzerinden geçirilir. Talk sağlayıcı/sağlayıcı eşlemi normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu nedenle yalnızca anahtar sırası farkları artık tekrarlanan işlem yapmayan `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için kurulu tüm Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veriler çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski Cron depo geçişleri">
    Doctor ayrıca zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri için cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) kontrol eder.

    Geçerli cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslimat alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslimat takma adları → açık `delivery.channel`
    - geçersiz kalıcı cron `payload.model` sentinelleri (`"default"`, `"null"`, boş dizeler, JSON `null`) → kaldırılmış model geçersiz kılması
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak taşır. Bir iş eski notify fallback davranışını mevcut Webhook dışı bir teslim modu ile birleştiriyorsa doctor uyarı verir ve bu işi manuel incelemeye bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çağırıyorsa da uyarı verir. Bu host-local betik güncel OpenClaw tarafından bakım altında değildir ve cron systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel sağlık kontrolleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturumu dizinini eskimiş yazma kilidi dosyaları için tarar — bunlar bir oturum anormal şekilde sonlandığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eskimiş kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda eskimiş kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transcript dalı onarımı">
    Doctor, ajan oturumu JSONL dosyalarını 2026.4.24 prompt transcript yeniden yazma hatasının oluşturduğu yinelenmiş dal şekli için tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı sırası ve aynı görünür kullanıcı prompt'unu içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transcript'i etkin dala yeniden yazar; böylece Gateway geçmişi ve bellek okuyucuları artık yinelenmiş sıralar görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmanızı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (ve sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş I/O ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele I/O, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerinden kaçınmak için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transcript uyumsuzluğu**: son oturum girdilerinde eksik transcript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlı JSONL"**: ana transcript yalnızca bir satıra sahipse işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ana dizinler genelinde birden çok `~/.openclaw` klasörü varsa veya `OPENCLAW_STATE_DIR` başka bir yeri gösteriyorsa uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, onu uzak host üzerinde çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolması)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar süresi dolmak üzereyken/dolmuşken uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili eskimişse bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme prompt'ları yalnızca etkileşimli (TTY) çalışırken görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu raporlar ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şunlar nedeniyle geçici olarak kullanılamayan kimlik doğrulama profillerini de raporlar:

    - kısa cooldown'lar (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model referansını katalog ve allowlist'e göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandbox etkinleştirildiğinde doctor Docker imajlarını kontrol eder ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılık hazırlama durumunu kaldırır. Bu, eskimiş oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, önceki bundled-plugin bağımlılık onarım kodundan kalan paket yerel kalıntıları ve güncel paketlenmiş manifest'i gölgeleyebilen bundled `@openclaw/*` Plugin'lerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara referans verdiğinde ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış ajan çalışma zamanları yer alır. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlangıcı ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet taşıma işlemleri ve temizlik ipuçları">
    Doctor, eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp OpenClaw hizmetini geçerli Gateway portunu kullanarak kurmayı teklif eder. Ek Gateway benzeri hizmetleri de tarayabilir ve temizlik ipuçları yazdırabilir. Profil adlı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi Gateway hizmeti eksik ancak sistem düzeyi OpenClaw Gateway hizmeti mevcutsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın ya da Gateway yaşam döngüsüne bir sistem supervisor'ı sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix taşıma işlemi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum taşıma işlemi olduğunda doctor (`--fix` / `--repair` modunda) taşıma öncesi bir snapshot oluşturur ve ardından en iyi çaba taşıma adımlarını çalıştırır: eski Matrix durum taşıma işlemi ve eski şifreli durum hazırlığı. Her iki adım da fatal değildir; hatalar günlüğe yazılır ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu kontrol tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliğinin artık onaylı kayıtla eşleşmediği public-key uyumsuzluğu onarımları
    - onaylanmış rol için etkin token eksik olan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme baseline'ının dışına kayan eşleştirilmiş token'lar
    - mevcut makine için Gateway tarafı token rotasyonundan önceye ait veya eskimiş kapsam metadata'sı taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor, eşleştirme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - eskimiş bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirilmiş ama hâlâ eşleştirme gerekli alınıyor" boşluğunu kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eskimiş token/cihaz kimliği sapmasından ayırt eder.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı allowlist olmadan DM'lere açık olduğunda veya bir politika tehlikeli şekilde yapılandırıldığında uyarı üretir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway'in oturum kapatıldıktan sonra canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve allowlist tarafından engellenmiş Skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanının yanında mevcut olduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; tüm hatalar için Plugin ID'lerini listeler; paket Plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayımlanan tüm yükleme zamanı uyarılarını veya hatalarını görünür kılar.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya üzerinde olup olmadığını kontrol eder. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kırpma yüzdesini, kırpma nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir oranı olarak raporlar. Dosyalar kırpıldığında veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eskimiş kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e referans veren kopuk kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` override'ları. Bu, kanal çalışma zamanı yokken yapılandırma hâlâ Gateway'den ona bağlanmasını istediğinde oluşan Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, sekme tamamlamanın geçerli kabuk için (zsh, bash, fish veya PowerShell) kurulu olup olmadığını kontrol eder:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor kurulmasını ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği manuel olarak yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama kontrolleri (yerel token)">
    Doctor, yerel Gateway token kimlik doğrulama hazırlığını kontrol eder.

    - Token modu bir token gerektiriyor ve hiçbir token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token` yalnızca hiçbir token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef-aware onarımlar">
    Bazı onarım akışlarının, çalışma zamanı fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabilir olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token'ı SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökmek ya da token'ı eksik olarak yanlış raporlamak yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık kontrolü + yeniden başlatma">
    Doctor bir sağlık kontrolü çalıştırır ve Gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek arama hazırlığı">
    Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan agent için hazır olup olmadığını kontrol eder. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin mevcut ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili yol seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan uzak/indirilebilir model URL'si olup olmadığını kontrol eder. Eksikse, uzak sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage`, vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini kontrol eder, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (kontrol sırasında Gateway sağlıklıydı), doctor sonucunu CLI tarafından görülebilen yapılandırmayla çapraz karşılaştırır ve tutarsızlıkları belirtir. Doctor varsayılan yolda yeni bir embedding ping'i başlatmaz; canlı sağlayıcı kontrolü istediğinizde derin bellek durum komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durum uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durum yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları raporlar.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya eski varsayılanlar açısından kontrol eder (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve servis dosyasını/görevi mevcut varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway servis yaşam döngüsü için doctor'ı salt okunur tutar. Servis sağlığını yine raporlar ve servis dışı onarımları çalıştırır, ancak harici bir supervisor bu yaşam döngüsüne sahip olduğu için servis kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırması yeniden yazımları ve eski servis temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkinken komut/entrypoint metaverilerini yeniden yazmaz. Ayrıca, eşlik eden servis dosyalarının temizleme gürültüsü oluşturmaması için yinelenen servis taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa, doctor servis kurma/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor servis ortamı metaverilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli servis ortamı değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için servis metaverilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` değerini sabitlediğini algılar ve servis metaverilerini mevcut porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenememişse, doctor kurulum/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulum/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor token sapması kontrolleri artık servis kimlik doğrulama metaverilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Her zaman `openclaw gateway install --force` ile tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor servis çalışma zamanını (PID, son çıkış durumu) inceler ve servis kurulu ancak gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını kontrol eder ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) raporlar.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway servisi Bun veya sürüm yönetimli Node yolu (`nvm`, `fnm`, `volta`, `asdf`, vb.) üzerinde çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü servis shell init'inizi yüklemez. Doctor, mevcut olduğunda sistem Node kurulumuna geçirmeyi önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'ları etkileşimli shell PATH'ini kopyalamak yerine standart bir sistem PATH'i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node alt süreçlerinin çözümlendiğini değiştirmez. Linux servisleri açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korumaya devam eder, ancak tahmin edilen sürüm yöneticisi fallback dizinleri yalnızca bu dizinler diskte mevcut olduğunda servis PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz metaverileri">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz metaverilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) için tam kılavuza [/concepts/agent-workspace](/tr/concepts/agent-workspace) bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
