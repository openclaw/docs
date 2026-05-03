---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Geriye dönük uyumluluğu bozan yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-03T21:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + migration aracıdır. Eski config/state öğelerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul et (uygulanabilir olduğunda restart/service/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Önerilen onarımları sormadan uygula (güvenli olduğunda onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Agresif onarımları da uygula (özel supervisor config dosyalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Sormadan çalıştır ve yalnızca güvenli migration işlemlerini uygula (config normalleştirme + disk üzerindeki state taşıma işlemleri). İnsan onayı gerektiren restart/service/sandbox eylemlerini atlar. Legacy state migration işlemleri algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem servislerini tara (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri gözden geçirmek istiyorsan önce config dosyasını aç:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Git kurulumları için isteğe bağlı ön uçuş update işlemi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config and migrations">
    - Legacy değerler için config normalleştirme.
    - Legacy düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk config migration işlemi.
    - Legacy Chrome eklentisi config dosyaları ve Chrome MCP hazır olma durumu için tarayıcı migration denetimleri.
    - OpenCode provider geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken tool policy hâlâ wildcard veya plugin-owned araçlar istediğinde Plugin/tool allowlist uyarıları.
    - Legacy disk üzeri state migration işlemi (sessions/agent dir/WhatsApp auth).
    - Legacy Plugin manifest contract anahtarı migration işlemi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Legacy cron deposu migration işlemi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Legacy agent runtime-policy migration işlemi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkin olduğunda eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları etkisiz containment config olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="State and integrity">
    - Session lock dosyası incelemesi ve eski lock temizliği.
    - Etkilenen 2026.4.24 derlemelerinin oluşturduğu yinelenmiş prompt-rewrite branch'leri için session transcript onarımı.
    - Takılı kalmış subagent restart-recovery tombstone algılama; startup'ın child'ı restart-aborted olarak ele almaya devam etmemesi için eski aborted recovery bayraklarını temizlemede `--fix` desteği.
    - State bütünlüğü ve izin denetimleri (sessions, transcripts, state dir).
    - Yerel çalışırken config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/disabled durumlarını raporlar.
    - Ek workspace dir algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Sandbox etkin olduğunda sandbox image onarımı.
    - Legacy service migration ve ek gateway algılama.
    - Matrix channel legacy state migration işlemi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (servis kurulu ama çalışmıyor; cache'lenmiş launchd etiketi).
    - Channel durum uyarıları (çalışan gateway'den yoklanır).
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya update sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan gateway servisleri için embedded proxy ortamı temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node vs Bun, version-manager yolları).
    - Gateway port çakışması tanılaması (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Açık DM policy'leri için güvenlik uyarıları.
    - Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token oluşturma sunar; token SecretRef config dosyalarının üzerine yazmaz).
    - Device pairing sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token cache sapması ve paired-record auth sapması).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux'ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (context dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Varsayılan agent için Skills hazır olma denetimi; eksik binary, env, config veya OS gereksinimleri bulunan izinli skill'leri raporlar ve `--fix`, kullanılamayan skill'leri `skills.entries` içinde devre dışı bırakabilir.
    - Shell completion durum denetimi ve otomatik kurulum/yükseltme.
    - Memory search embedding provider hazır olma denetimi (yerel model, remote API key veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm workspace uyuşmazlığı, eksik UI asset'leri, eksik tsx binary).
    - Güncellenmiş config + wizard metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, temellendirilmiş dreaming workflow'u için **Geri Doldur**, **Sıfırla** ve **Temellendirilmiş Olanları Temizle** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/migration parçası **değildir**.

Yaptıkları:

- **Geri Doldur**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, temellendirilmiş REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca işaretlenmiş bu geri doldurma günlük girdilerini `DREAMS.md` içinden kaldırır.
- **Temellendirilmiş Olanları Temizle**, yalnızca geçmiş replay'den gelen ve henüz live recall ya da daily support biriktirmemiş staged grounded-only kısa vadeli girdileri kaldırır.

Kendi başlarına **yapmadıkları**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor migration işlemlerini çalıştırmazlar
- staged CLI yolunu açıkça önce çalıştırmadığın sürece temellendirilmiş adayları live kısa vadeli promotion deposuna otomatik olarak stage etmezler

Temellendirilmiş historical replay'in normal deep promotion lane'i etkilemesini istiyorsan bunun yerine CLI akışını kullan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken temellendirilmiş kalıcı adayları kısa vadeli dreaming deposuna stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce update (fetch/rebase/build) teklif eder.
  </Accordion>
  <Accordion title="1. Config normalization">
    Config, legacy değer biçimleri içeriyorsa (örneğin channel'a özgü override olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna legacy Talk düz alanları dahildir. Geçerli public Talk config, `talk.provider` + `talk.providers.<provider>` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini provider map'ine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş değilken ve tool policy
    wildcard veya plugin-owned tool girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    allowlist'i atlamaz.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Config deprecated anahtarlar içerdiğinde diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanı ister.

    Doctor şunları yapar:

    - Hangi legacy anahtarların bulunduğunu açıklar.
    - Uyguladığı migration işlemini gösterir.
    - Güncellenmiş şemayla `~/.openclaw/openclaw.json` dosyasını yeniden yazar.

    Gateway ayrıca legacy config biçimi algıladığında startup sırasında doctor migration işlemlerini otomatik çalıştırır, böylece eski config dosyaları manuel müdahale olmadan onarılır. Cron job deposu migration işlemleri `openclaw doctor --fix` tarafından gerçekleştirilir.

    Geçerli migration işlemleri:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Adlandırılmış `accounts` içeren ama tek hesaplı üst düzey kanal değerleri kalan kanallar için, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı aktarma ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlangıcı, `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlı sağlayıcıları kapalı başarısız olmak yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu geçerli ana makine yerel Chrome MCP ekleme modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144 altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - Gateway/Node ana makinesinde Chromium tabanlı 144+ tarayıcı
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk ekleme onay isteminin onaylanması

    Buradaki hazırlık yalnızca yerel ekleme önkoşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özel düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'te düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth yanında bu eski taşıma ayarlarını gördüğünde uyarır; böylece eski taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex Plugin rota uyarıları">
    Paketle gelen Codex Plugin etkinleştirildiğinde, doctor `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözülüp çözülmediğini de denetler. PI üzerinden Codex OAuth/abonelik kimlik doğrulaması istediğinizde bu kombinasyon geçerlidir, ancak yerel Codex uygulama sunucusu donanımıyla kolayca karıştırılabilir. Doctor uyarır ve açık uygulama sunucusu biçimini gösterir: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü her iki rota da geçerlidir:

    - `openai-codex/*` + PI, "Codex OAuth/abonelik kimlik doğrulamasını normal OpenClaw çalıştırıcısı üzerinden kullan" anlamına gelir.
    - `openai/*` + `agentRuntime.id: "codex"`, "yerleşik turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth kasıtlıysa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor eski disk üzerindeki düzenleri geçerli yapıya taşıyabilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotenttir; doctor eski klasörleri yedek olarak bıraktığında uyarılar yayar. Gateway/CLI, başlangıçta eski oturumları ve ajan dizinini de otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller, elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` ile geçirilir. Konuşma sağlayıcısı/sağlayıcı eşlemesi normalleştirmesi artık yapısal eşitlikle karşılaştırır; bu yüzden yalnızca anahtar sırası farkları artık tekrarlayan işlemsiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tüm yüklü Plugin manifestlerini tarar. Bulduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarında zaten aynı değerler varsa eski anahtar veriyi çoğaltmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından denetler.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` Webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak geçirir. Bir iş eski bildirim yedeğini mevcut Webhook dışı teslim modu ile birleştiriyorsa, doctor uyarır ve o işi elle inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'i hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çağırıyorsa da uyarır. Bu ana makine yerel betik geçerli OpenClaw tarafından bakımı yapılmaz ve cron systemd kullanıcı veriyoluna ulaşamadığında `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; geçerli sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturum dizinini eski yazma kilidi dosyaları için tarar — bir oturum anormal şekilde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal yapısı için ajan oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka bir yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı konusunda uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu verir).
    - **macOS bulut eşitlemeli durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girişlerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyor).
    - **Birden fazla durum dizini**: ev dizinleri genelinde birden fazla `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, onu uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresinin dolması)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, token'lar süresi dolmak üzereyse/dolmuşsa uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili eskiyse bir Anthropic API anahtarı veya Anthropic kurulum token'ı yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme girişimlerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini de bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu katalog ve izin listesine göre doğrular ve çözümlenmediğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox görüntü onarımı">
    Sandbox etkinleştirildiğinde doctor Docker görüntülerini denetler ve mevcut görüntü eksikse eski adlara geçmeyi veya oluşturmayı teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum aşaması dizinlerini ve önceki paketlenmiş Plugin bağımlılığı onarım kodundan kalan paket yerel kalıntıları kapsar.

    Doctor ayrıca yapılandırma onlara başvuruyor ancak yerel Plugin kayıt defteri bunları bulamıyorsa yapılandırılmış indirilebilir Plugin'leri yeniden kurabilir. 2026.5.2 paketlenmiş Plugin dışsallaştırması için doctor, mevcut yapılandırmanın zaten kullandığı indirilebilir Plugin'leri otomatik olarak kurar ve ardından bu sürüm geçişini yalnızca bir kez çalıştırmak için `meta.lastTouchedVersion` değerine güvenir. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/kurulum/güncelleme işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor, eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırmayı ve mevcut gateway bağlantı noktasını kullanarak OpenClaw hizmetini kurmayı teklif eder. Ayrıca fazladan gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlandırmalı OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın ya da bir sistem süpervizörü gateway yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya eyleme geçirilebilir bir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlatma devam eder. Salt okunur modda (`openclaw doctor` `--fix` olmadan) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliğinin hâlâ eşleştiği ancak cihaz kimliğinin onaylı kayıtla artık eşleşmediği genel anahtar uyuşmazlığı onarımları
    - onaylı bir rol için etkin token’ı olmayan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temel çizgisinin dışına kayan eşleştirilmiş token’lar
    - geçerli makine için gateway tarafında token döndürmesinden önce oluşturulmuş veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor, eşleştirme isteklerini otomatik onaylamaz veya cihaz token’larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - `openclaw devices remove <deviceId>` ile eski bir kaydı kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirilmiş ama hâlâ eşleştirme gerekli hatası alınıyor" açığını kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı DM’lere izin listesi olmadan açıksa veya bir ilke tehlikeli bir şekilde yapılandırılmışsa uyarılar yayınlar.
  </Accordion>
  <Accordion title="10. systemd kalıcılığı (Linux)">
    Bir systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway’in oturum kapatıldıktan sonra çalışmaya devam etmesi için kalıcılığın etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (skills, plugins ve eski dizinler)">
    Doctor, varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş skills sayılarını verir.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanının yanında varsa uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı plugins sayılarını verir; hatalar için plugin kimliklerini listeler; paket plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: geçerli runtime ile uyumluluk sorunları olan plugins için işaretler.
    - **Plugin tanılamaları**: plugin kayıt defterinin yükleme sırasında yaydığı tüm uyarı veya hataları gösterir.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın ya da onun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir oranı olarak raporlar. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin’ini kaldırdığında, bu Plugin’e başvuran boşa düşmüş kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal runtime’ı kaldırılmışken yapılandırmanın hâlâ Gateway’den ona bağlanmasını istediği Gateway açılış döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı kullanıyorsa (`source <(openclaw completion ...)`), doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor bunu kurmayı önerir (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel Gateway token kimlik doğrulama hazır olma durumunu denetler.

    - Token modu bir token gerektiriyor ve token kaynağı yoksa doctor bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef uyumlu onarımlar">
    Bazı onarım akışlarının, runtime fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token’ı SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu raporlar ve token’ı eksik diye yanlış raporlamak veya çöklemek yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve Gateway sağlıksız göründüğünde yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması embedding sağlayıcısının varsayılan aracı için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve elle ikili yol seçeneği dahil olmak üzere düzeltme yönergeleri yazdırır.
    - **Açık yerel sağlayıcı**: yerel bir model dosyası veya tanınan bir uzak/indirilebilir model URL'si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage`, vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarının bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, sonra otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (denetim sırasında Gateway sağlıklıydı), doctor bu sonucu CLI'dan görülebilen yapılandırmayla çapraz başvurur ve tutarsızlıkları belirtir. Doctor varsayılan yolda yeni bir embedding ping'i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, kurulu supervisor yapılandırmasında (launchd/systemd/schtasks) eksik veya eski varsayılanlar (örn. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi) olup olmadığını denetler. Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor'ı salt okunur tutar. Hizmet sağlığını bildirmeye ve hizmet dışı onarımları çalıştırmaya devam eder, ancak bu yaşam döngüsünün sahibi harici bir supervisor olduğu için hizmet kurulumunu/başlatmayı/yeniden başlatmayı/bootstrap işlemini, supervisor yapılandırma yeniden yazmalarını ve eski hizmet temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkinken komut/entrypoint meta verilerini yeniden yazmaz. Ayrıca, eşlik eden hizmet dosyalarının temizlik gürültüsü oluşturmaması için yinelenen hizmet taraması sırasında etkin olmayan ve eski olmayan ek Gateway benzeri birimleri yok sayar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortam değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenemiyorsa, doctor kurulum/onarım yolunu uygulanabilir yönergelerle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı systemd birimleri için doctor token sapması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekte çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun üzerinde veya sürümle yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf`, vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir, çünkü hizmet kabuk başlatma dosyanızı yüklemez. Doctor, mevcut olduğunda sistem Node kurulumuna geçmeyi önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'lar, etkileşimli kabuk PATH'ini kopyalamak yerine standart bir sistem PATH'i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node alt süreçlerinin çözümlendiğini değiştirmez. Linux hizmetleri açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı ikili dizinlerini hâlâ korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) hakkında eksiksiz kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
