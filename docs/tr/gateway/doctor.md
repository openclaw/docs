---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Geriye dönük uyumsuz yapılandırma değişiklikleri sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Tanılama
x-i18n:
    generated_at: "2026-05-11T20:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + migration aracıdır. Eski config/state’i düzeltir, sağlık denetimleri yapar ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul et (uygun olduğunda yeniden başlatma/service/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Sormadan önerilen onarımları uygula (güvenli olduğunda onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Agresif onarımları da uygula (özel supervisor config’lerinin üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Soru sormadan çalıştır ve yalnızca güvenli migration’ları uygula (config normalleştirme + diskteki state taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/service/sandbox eylemlerini atlar. Eski state migration’ları algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem service’lerini tara (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız, önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol schema’sı daha yeniyse Control UI’ı yeniden oluşturur).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve plugin durumu.

  </Accordion>
  <Accordion title="Config ve migration’lar">
    - Eski değerler için config normalleştirme.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk config migration’ı.
    - Eski Chrome extension config’leri ve Chrome MCP hazır oluşu için tarayıcı migration denetimleri.
    - OpenCode provider override uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth shadowing uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken tool policy hâlâ joker karakter veya plugin’e ait araçlar istediğinde Plugin/tool allowlist uyarıları.
    - Eski diskteki state migration’ı (sessions/agent dir/WhatsApp auth).
    - Eski plugin manifest contract key migration’ı (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron store migration’ı (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook fallback jobs).
    - Eski tüm-agent runtime-policy temizliği; provider/model runtime policy etkin route selector’dır.
    - Plugin’ler etkinken stale plugin config temizliği; `plugins.enabled=false` olduğunda stale plugin referansları inert containment config olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="State ve bütünlük">
    - Session lock dosyası incelemesi ve stale lock temizliği.
    - Etkilenen 2026.4.24 build’lerinin oluşturduğu yinelenmiş prompt-rewrite branch’leri için session transcript onarımı.
    - Wedged subagent restart-recovery tombstone algılama; startup’ın child’ı restart-aborted olarak ele almaya devam etmemesi için stale aborted recovery flag’lerini temizlemede `--fix` desteği.
    - State bütünlüğü ve izin denetimleri (sessions, transcripts, state dir).
    - Yerel çalıştırıldığında config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token’ları yenileyebilir ve auth-profile cooldown/disabled durumlarını raporlar.
    - Ek workspace dir algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, service’ler ve supervisor’lar">
    - Sandbox etkinse sandbox image onarımı.
    - Eski service migration’ı ve ek gateway algılama.
    - Matrix channel eski state migration’ı (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (service kurulu ama çalışmıyor; cache’lenmiş launchd label’ı).
    - Channel durum uyarıları (çalışan gateway’den yoklanır).
    - Channel’a özel izin denetimleri `openclaw channels capabilities` altında yer alır; örneğin Discord voice channel izinleri `openclaw channels capabilities --channel discord --target channel:<channel-id>` ile denetlenir.
    - Yerel TUI client’ları hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI client’larını durdurur.
    - Primary models, fallback’ler, heartbeat/subagent/compaction override’ları, hooks, channel model override’ları ve session route pin’lerindeki eski `openai-codex/*` model ref’leri için Codex route onarımı; `--fix` bunları `openai/*` olarak yeniden yazar, stale session/tüm-agent runtime pin’lerini kaldırır ve canonical OpenAI agent ref’lerini varsayılan Codex harness üzerinde bırakır.
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış gateway service’leri için gömülü proxy environment temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node vs Bun, version-manager path’leri).
    - Gateway port çakışması tanıları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve pairing">
    - Açık DM policy’leri için güvenlik uyarıları.
    - Local token mode için Gateway auth denetimleri (token kaynağı yoksa token oluşturma sunar; token SecretRef config’lerinin üzerine yazmaz).
    - Device pairing sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen role/scope upgrade’leri, stale local device-token cache drift’i ve paired-record auth drift’i).

  </Accordion>
  <Accordion title="Workspace ve shell">
    - Linux’ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (context dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Varsayılan agent için Skills hazır olma denetimi; eksik bin, env, config veya OS gereksinimleri olan izinli skills’i raporlar ve `--fix`, kullanılamayan skills’i `skills.entries` içinde devre dışı bırakabilir.
    - Shell completion durum denetimi ve otomatik kurulum/yükseltme.
    - Memory search embedding provider hazır olma denetimi (yerel model, uzak API key veya QMD binary).
    - Source install denetimleri (pnpm workspace uyuşmazlığı, eksik UI assets, eksik tsx binary).
    - Güncellenmiş config + wizard metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill ve reset

Control UI Dreams sahnesi, grounded dreaming workflow’u için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemleri kullanır, ancak `openclaw doctor` CLI onarım/migration’ının parçası **değildir**.

Yaptıkları:

- **Backfill**, etkin workspace’teki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM diary pass’i çalıştırır ve geri alınabilir backfill entry’lerini `DREAMS.md` içine yazar.
- **Reset**, `DREAMS.md` içinden yalnızca işaretli backfill diary entry’lerini kaldırır.
- **Clear Grounded**, yalnızca geçmiş replay’den gelen ve henüz live recall veya daily support biriktirmemiş staged grounded-only short-term entry’leri kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- full doctor migration’ları çalıştırmazlar
- önce staged CLI path’i açıkça çalıştırmadığınız sürece grounded candidate’leri otomatik olarak live short-term promotion store içine stage etmezler

Grounded historical replay’in normal deep promotion lane’i etkilemesini istiyorsanız, bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded durable candidate’leri short-term dreaming store içine stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor’ı çalıştırmadan önce güncelleme (fetch/rebase/build) teklif eder.
  </Accordion>
  <Accordion title="1. Config normalleştirme">
    Config eski değer biçimleri içeriyorsa (örneğin channel’a özel override olmadan `messages.ackReaction`), doctor bunları güncel schema’ya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Geçerli public Talk speech config’i `talk.provider` + `talk.providers.<provider>`, realtime voice config ise `talk.realtime.*` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini provider map içine yeniden yazar ve eski üst düzey realtime selector’ları (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve tool policy joker karakter
    veya plugin’e ait tool entry’leri kullandığında uyarır. `tools.allow: ["*"]` yalnızca gerçekten yüklenen plugin’lerden gelen araçlarla eşleşir;
    exclusive plugin allowlist’i bypass etmez. Doctor, mevcut bundled provider davranışını korumak için migrate edilmiş
    eski allowlist config’lerine `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha sıkı `"allowlist"` ayarını gösterir.

  </Accordion>
  <Accordion title="2. Eski config key migration’ları">
    Config deprecated key’ler içerdiğinde, diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski key’lerin bulunduğunu açıklar.
    - Uyguladığı migration’ı gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş schema ile yeniden yazar.

    Gateway startup, eski config formatlarını reddeder ve `openclaw doctor --fix` çalıştırmanızı ister; startup sırasında `openclaw.json` dosyasını yeniden yazmaz. Cron job store migration’ları da `openclaw doctor --fix` tarafından ele alınır.

    Geçerli migration’lar:

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
    - Adlandırılmış `accounts` bulunan ancak tek hesaplı üst düzey kanal değerleri kalmış kanallarda, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (araçlar/yükseltilmiş/exec/sandbox/alt ajanlar)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş provider/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski eklenti relay ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış provider'ları kapalı hata vermek yerine atlar)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` öğesini kaldırın; Codex app-server Codex'e özgü çalışma alanı araçlarını her zaman özgün tutar

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@earendil-works/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome eklentisi yolunu gösteriyorsa, doctor bunu geçerli ana makine yerel Chrome MCP attach modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede yüklü olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerel olarak çalışması
    - o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk attach onay isteminin onaylanması

    Buradaki hazır olma durumu yalnızca yerel attach önkoşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, uzak tarayıcı veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'te düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth provider yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece eskimiş taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca üst bilgi geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor eski `openai-codex/*` model ref'lerini kontrol eder. Yerel Codex harness yönlendirmesi kanonik `openai/*` model ref'lerini kullanır; OpenAI ajan dönüşleri OpenClaw PI OpenAI yolu yerine Codex app-server harness üzerinden geçer.

    `--fix` / `--repair` modunda doctor, birincil modeller, yedekler, heartbeat/alt ajan/compaction geçersiz kılmaları, hook'lar, kanal model geçersiz kılmaları ve eskimiş kalıcı oturum rota durumu dahil olmak üzere etkilenen varsayılan ajan ve ajan başına ref'leri yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Codex amacı, onarılan ajan model ref'leri için provider/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşınır; böylece model ref'i `openai/*` olduktan sonra `openai-codex:...` auth profilleri hâlâ seçilebilir.
    - Runtime seçimi provider/model kapsamlı olduğundan, eskimiş bütün ajan runtime yapılandırması ve kalıcı oturum runtime pin'leri kaldırılır.
    - Onarılan eski model ref'i eski auth yolunu korumak için Codex yönlendirmesine ihtiyaç duymadıkça mevcut provider/model runtime ilkesi korunur.
    - Mevcut model yedek listeleri, eski girdileri yeniden yazılmış şekilde korunur; kopyalanan model başına ayarlar eski anahtardan kanonik `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri ve auth profil pin'leri keşfedilen tüm ajan oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx adaptörünü kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor ayrıca yapılandırılmış modelleri veya runtime'ı Codex gibi Plugin sahipli bir rotadan uzaklaştırdıktan sonra, eskimiş otomatik oluşturulmuş rota durumu için keşfedilen ajan oturum depolarını tarar.

    `openclaw doctor --fix`, sahip oldukları rota artık yapılandırılmadığında `modelOverrideSource: "auto"` model pin'leri, runtime model meta verileri, pin'lenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik auth profili geçersiz kılmaları gibi otomatik oluşturulmuş eskimiş durumları temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri elle inceleme için raporlanır ve olduğu gibi bırakılır; bu rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor eski disk üzeri düzenleri geçerli yapıya taşıyabilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp auth durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu taşıma işlemleri en iyi çabayla yapılır ve idempotenttir; doctor herhangi bir eski klasörü yedek olarak geride bıraktığında uyarı verir. Gateway/CLI ayrıca başlangıçta eski oturumları + ajan dizinini otomatik olarak taşır; böylece geçmiş/auth/modeller elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp auth bilinçli olarak yalnızca `openclaw doctor` aracılığıyla taşınır. Talk provider/provider-map normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu yüzden yalnızca anahtar sırasından kaynaklanan farklar artık yinelenen etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için yüklü tüm Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu taşıma idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar, veriler çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ayrıca cron job deposunda (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski job şekillerini kontrol eder.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslimat alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslimat takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak taşır. Bir iş eski notify yedeğini mevcut webhook olmayan bir teslimat moduyla birleştirirse, doctor uyarır ve o işi elle inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` dosyasını çağırdığında da uyarır. Bu ana makineye yerel betik, mevcut OpenClaw tarafından bakımı yapılmaz ve cron systemd kullanıcı veri yoluna ulaşamadığında `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel sağlık kontrolleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her aracı oturum dizinini eski yazma kilidi dosyaları için tarar — bunlar bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID, 30 dakikadan eski veya OpenClaw dışı bir sürece ait olduğu kanıtlanabilen canlı PID). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi takdirde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı ister.
  </Accordion>
  <Accordion title="3d. Oturum transkripti dal onarımı">
    Doctor, aracı oturum JSONL dosyalarını 2026.4.24 prompt transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal şekli için tarar: OpenClaw iç runtime bağlamı olan terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı prompt'unu içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü kontrolleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu verir).
    - **macOS bulut eşitlemeli durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptin yalnızca bir satırı olduğunda işaretler (geçmiş birikmiyor).
    - **Birden çok durum dizini**: ana dizinler arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` değerine sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süre sonu)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar süresi dolmak üzereyken/süresi dolduğunda uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili bayatsa, bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalıştırıldığında (TTY) görünür; `--non-interactive` yenileme girişimlerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca aşağıdaki nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa, doctor model referansını katalog ve izin listesine göre doğrular ve çözümlenmediğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imaj onarımı">
    Sandbox etkinleştirildiğinde, doctor Docker imajlarını kontrol eder ve mevcut imaj eksikse eski adları derlemeyi veya bunlara geçmeyi önerir.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini, önceki paketlenmiş Plugin bağımlılık onarım kodundan kalan paket yerel kalıntılarını ve mevcut paketlenmiş manifesti gölgeleyebilen paketlenmiş `@openclaw/*` Plugin'lerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara referans verdiğinde ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış aracı runtime'ları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu tekrar çalıştırın. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/kurulum/güncelleme işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmeti geçişleri ve temizleme ipuçları">
    Tanı aracı eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli Gateway bağlantı noktasını kullanarak OpenClaw hizmetini yüklemeyi önerir. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adı verilmiş OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyindeki Gateway hizmeti eksikse ancak sistem düzeyinde bir OpenClaw Gateway hizmeti varsa, tanı aracı otomatik olarak ikinci bir kullanıcı düzeyi hizmet yüklemez. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından kopya hizmeti kaldırın ya da Gateway yaşam döngüsünü bir sistem gözetmeni yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Startup Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem gerektiren eski durum geçişi olduğunda, tanı aracı (`--fix` / `--repair` modunda) geçiş öncesi anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlatma devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Tanı aracı artık normal sağlık geçişinin bir parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliğinin hâlâ eşleştiği ancak cihaz kimliğinin onaylı kayıtla artık eşleşmediği genel anahtar uyuşmazlığı onarımları
    - onaylı bir rol için etkin token eksik olan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temel çizgisinin dışına sapan eşleştirilmiş token'lar
    - geçerli makine için Gateway tarafındaki token rotasyonundan önceye ait olan veya eski kapsam metaverileri taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Tanı aracı eşleştirme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekiyor" boşluğunu kapatır: tanı aracı artık ilk kez eşleştirmeyi, bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Tanı aracı, bir sağlayıcı izin listesi olmadan DM'lere açıksa veya bir politika tehlikeli bir şekilde yapılandırılmışsa uyarılar yayınlar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa, tanı aracı Gateway'in oturum kapatıldıktan sonra da çalışmaya devam etmesi için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Tanı aracı varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve izin listesi tarafından engellenmiş skills sayılarını gösterir.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanıyla birlikte mevcut olduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yükleme sırasında yayımlanan tüm uyarı veya hataları ortaya çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Tanı aracı, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın olup olmadığını veya onu aşıp aşmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kısaltma yüzdesini, kısaltma nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir kesri olarak bildirir. Dosyalar kısaltıldığında veya sınıra yaklaştığında, tanı aracı `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı yokken yapılandırmanın hâlâ Gateway'in ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Tanı aracı, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekmeyle tamamlamanın yüklü olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa, tanı aracı bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse, tanı aracı önbelleği otomatik olarak yeniden oluşturur.
    - Hiçbir tamamlama yapılandırılmamışsa, tanı aracı bunu yüklemeyi ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel gateway token kimlik doğrulaması hazırlığını denetler.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa, doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak kullanılamıyorsa, doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmamışsa oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef duyarlı onarımlar">
    Bazı onarım akışlarının, çalışma zamanının hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için status ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token'ı SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış ama kullanılamaz olduğunu bildirir ve çökme ya da token'ı eksik olarak yanlış raporlama yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve Gateway sağlıksız göründüğünde yeniden başlatmayı teklif eder.
  </Accordion>
  <Accordion title="13b. Bellek arama hazırlığı">
    Doctor, yapılandırılmış bellek arama gömme sağlayıcısının varsayılan aracı için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili dosya yolu seçeneği dahil düzeltme rehberi yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan bir uzak/indirilebilir model URL'si denetler. Eksikse, uzak sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (denetim sırasında Gateway sağlıklıydı), doctor bu sonucu CLI tarafından görülebilen yapılandırmayla çapraz denetler ve tutarsızlıkları not eder. Doctor, varsayılan yolda yeni bir gömme pingi başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında gömme hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Gözetmen yapılandırma denetimi + onarım">
    Doctor, kurulu gözetmen yapılandırmasını (launchd/systemd/schtasks) eksik veya eski varsayılanlar için denetler (örn. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara göre yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, gözetmen yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem olmadan uygular.
    - `openclaw doctor --repair --force`, özel gözetmen yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, doctor'ı Gateway hizmeti yaşam döngüsü için salt okunur tutar. Hizmet sağlığını hâlâ bildirir ve hizmet dışı onarımları çalıştırır, ancak bu yaşam döngüsüne dış bir gözetmen sahip olduğu için hizmet kurulumunu/başlatmasını/yeniden başlatmasını/önyüklemesini, gözetmen yapılandırması yeniden yazımlarını ve eski hizmet temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkinken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar, böylece eşlik eden hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini gözetmen hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Zamanlanmış Görev kurulumlarının satır içinde gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve bu değerlerin gözetmen tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta göre yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, doctor kurulum/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı systemd birimleri için doctor token sapması denetimleri artık hizmet auth meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Her zaman `openclaw gateway install --force` ile tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanıları">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun üzerinde veya sürüm tarafından yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet kabuk başlatmanızı yüklemez. Doctor, kullanılabilir olduğunda bir sistem Node kurulumuna geçmeyi teklif eder (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'ları, etkileşimli kabuk PATH'ini kopyalamak yerine standart bir sistem PATH'i (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Homebrew tarafından yönetilen sistem ikilileri kullanılabilir kalırken Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri Node alt süreçlerinin hangilerini çözümlediğini değiştirmez. Linux hizmetleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı ikili dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz meta verileri">
    Doctor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) hakkında tam rehber için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
