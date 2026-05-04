---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Geriye dönük uyumluluğu bozan yapılandırma değişikliklerini getirme
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Tanılama
x-i18n:
    generated_at: "2026-05-04T09:37:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski config/state öğelerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan önerilen onarımları uygula (güvenli olduğunda onarımlar + yeniden başlatmalar).

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

    Sormadan çalıştır ve yalnızca güvenli geçişleri uygula (config normalleştirme + disk üzerindeki state taşıma işlemleri). İnsan onayı gerektiren restart/service/sandbox eylemlerini atlar. Eski state geçişleri algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem servislerini tara (launchd/systemd/schtasks).

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
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engelli) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config ve geçişler">
    - Eski değerler için config normalleştirme.
    - Talk config geçişi: eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine.
    - Eski Chrome extension config dosyaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşul denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ wildcard veya Plugin'e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski disk üzerindeki state geçişi (oturumlar/agent dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest contract anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron store geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` webhook fallback işleri).
    - Eski agent runtime-policy geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkinleştirildiğinde eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları inert containment config olarak değerlendirilir ve korunur.

  </Accordion>
  <Accordion title="State ve bütünlük">
    - Oturum lock dosyası incelemesi ve eski lock temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-rewrite dalları için oturum transcript onarımı.
    - Sıkışmış subagent restart-recovery tombstone algılama; `--fix` desteğiyle eski iptal edilmiş recovery bayraklarını temizler, böylece başlangıç child öğesini restart-aborted olarak değerlendirmeyi sürdürmez.
    - State bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, state dizini).
    - Yerelde çalışırken config dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/disabled durumlarını bildirir.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servisler ve supervisor'lar">
    - Sandbox etkinleştirildiğinde sandbox image onarımı.
    - Eski servis geçişi ve ek gateway algılama.
    - Matrix kanalı eski state geçişi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durumu uyarıları (çalışan gateway üzerinden yoklanır).
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış gateway servisleri için gömülü proxy ortam temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node vs Bun, version-manager yolları).
    - Gateway port çakışması tanıları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - local token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef config dosyalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel device-token önbellek sapması ve paired-record kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve shell">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosyası boyutu denetimi (context dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan agent için Skills hazırlık denetimi; eksik bin, env, config veya OS gereksinimleri olan izin verilen skills öğelerini bildirir ve `--fix`, kullanılamayan skills öğelerini `skills.entries` içinde devre dışı bırakabilir.
    - Shell completion durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek araması embedding sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyumsuzluğu, eksik UI assets, eksik tsx binary).
    - Güncellenmiş config + sihirbaz metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve tersine çevrilebilir backfill girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca işaretlenmiş bu backfill günlük girdilerini `DREAMS.md` içinden kaldırır.
- **Clear Grounded**, yalnızca geçmiş replay'den gelen ve henüz canlı recall veya günlük destek biriktirmemiş staged grounded-only kısa vadeli girdileri kaldırır.

Kendi başlarına ne yapmazlar:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- staged CLI yolunu açıkça önce çalıştırmadığınız sürece grounded adayları otomatik olarak canlı kısa vadeli promotion store içine stage etmezler

Grounded geçmiş replay'in normal deep promotion hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak korurken grounded durable adayları kısa vadeli dreaming store içine stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa doctor'ı çalıştırmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalleştirme">
    Config eski değer şekilleri içeriyorsa (örneğin kanala özgü bir override olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Geçerli herkese açık Talk config, `talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı haritasına yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    wildcard veya Plugin'e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]`, yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    izin listesini bypass etmez.

  </Accordion>
  <Accordion title="2. Eski config anahtarı geçişleri">
    Config kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway ayrıca eski bir config biçimi algıladığında başlangıçta doctor geçişlerini otomatik çalıştırır; böylece eski config dosyaları manuel müdahale olmadan onarılır. Cron job store geçişleri `openclaw doctor --fix` tarafından işlenir.

    Geçerli geçişler:

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
    - adlandırılmış `accounts` içeren ancak tek hesaplı üst düzey kanal değerleri kalmış kanallar için, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı aktarma ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlı sağlayıcıları kapalı hata vermek yerine atlar)

    Doctor uyarıları ayrıca çok hesaplı kanallar için hesap varsayılanı rehberliğini içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğelerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor uyarır; böylece geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilirsiniz.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu geçerli ana makine-yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine-yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine-yerel Chrome MCP hâlâ şunları gerektirir:

    - Gateway/Node ana makinesinde Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerel olarak çalışması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıda ilk bağlanma onayı isteminin onaylanması

    Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz, bunlar daha yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski aktarım ayarlarını gördüğünde uyarır; böylece eskimiş aktarım geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex Plugin rota uyarıları">
    Paketli Codex Plugin etkinleştirildiğinde, doctor ayrıca `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözümlenip çözümlenmediğini denetler. Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden istediğinizde bu birleşim geçerlidir, ancak yerel Codex uygulama sunucusu çalıştırma yapısıyla karıştırılması kolaydır. Doctor uyarır ve açık uygulama sunucusu biçimini gösterir: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI, "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulaması kullan" anlamına gelir.
    - `openai/*` + `agentRuntime.id: "codex"`, "gömülü turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth kasıtlıysa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor eski disk üzeri düzenleri geçerli yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Aracı dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba esaslı ve idempotenttir; doctor, yedek olarak herhangi bir eski klasörü geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumları + aracı dizinini otomatik geçirir; böylece geçmiş/kimlik doğrulama/modeller, elle doctor çalıştırmadan aracı başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` üzerinden geçirilir. Konuşma sağlayıcısı/sağlayıcı eşlemesi normalleştirmesi artık yapısal eşitliğe göre karşılaştırır; bu nedenle yalnızca anahtar sırası farkları artık tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin bildirim geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tüm yüklü Plugin bildirimlerini tarar. Bulduğunda bunları `contracts` nesnesine taşımayı ve bildirim dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veriler yinelenmeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından denetler.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` Webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik geçirir. Bir iş eski bildirim yedeğini mevcut Webhook dışı teslim moduyla birleştirirse, doctor uyarır ve o işi elle inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çağırıyorsa da uyarır. Bu ana makine-yerel betik geçerli OpenClaw tarafından sürdürülmez ve cron systemd kullanıcı veriyoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` içine hatalı `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; geçerli sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizleme">
    Doctor, her agent oturum dizinini bayat yazma kilidi dosyaları için tarar; bunlar bir oturum anormal şekilde çıktığında geride kalan dosyalardır. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve bayat kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda bayat kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 prompt transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için agent oturum JSONL dosyalarını tarar: OpenClaw iç çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı promptunu içeren aktif bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı orijinalin yanına yedekler ve transkripti aktif dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmanızı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu da yayınlar).
    - **macOS bulut eşitlemeli durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyumsuzluğu**: son oturum girişlerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyor).
    - **Birden fazla durum dizini**: ev dizinleri genelinde birden fazla `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir ise uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model auth sağlığı (OAuth süresi dolması)">
    Doctor, auth deposundaki OAuth profillerini inceler, tokenlar süresi dolmak üzereyken/süresi dolduğunda uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili bayatsa, bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme promptları yalnızca etkileşimli (TTY) çalışırken görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden auth gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/auth hataları)
    - daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model referansını katalog ve izin listesine göre doğrular; çözümlenmediğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imaj onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker imajlarını denetler ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılık hazırlama durumunu kaldırır. Bu, bayat oluşturulmuş bağımlılık köklerini, eski install-stage dizinlerini, daha önceki paketlenmiş Plugin bağımlılık onarım kodundan kalan paket yerel artıklarını ve geçerli paketlenmiş manifesti gölgeleyebilen paketlenmiş `@openclaw/*` Pluginlerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvurduğu halde yerel Plugin kayıt defteri bunları bulamadığında yapılandırılmış indirilebilir Pluginleri de yeniden kurabilir. 2026.5.2 paketlenmiş Plugin dışsallaştırması için doctor, mevcut yapılandırmanın zaten kullandığı indirilebilir Pluginleri otomatik olarak kurar ve ardından bu sürüm geçişini yalnızca bir kez çalıştırmak için `meta.lastTouchedVersion` değerine dayanır. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway servis geçişleri ve temizleme ipuçları">
    Doctor, eski gateway servislerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway bağlantı noktasını kullanarak OpenClaw servisini kurmayı teklif eder. Ayrıca ek gateway benzeri servisleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlı OpenClaw gateway servisleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta kullanıcı düzeyi gateway servisi eksikse ancak sistem düzeyi bir OpenClaw gateway servisi varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi servisi kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından kopyayı kaldırın ya da bir sistem denetleyicisi gateway yaşam döngüsüne sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya eyleme geçirilebilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe yazılır ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve auth kayması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleştiği halde cihaz kimliği onaylı kayıtla artık eşleşmeyen açık anahtar uyumsuzluğu onarımları
    - onaylı bir rol için aktif tokenı eksik olan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temelinin dışına kayan eşleştirilmiş tokenlar
    - geçerli makine için gateway tarafı token rotasyonundan eski olan veya bayat kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girişleri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz tokenlarını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - bayat bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekiyor" boşluğunu kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve bayat token/cihaz kimliği kaymasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir politika tehlikeli şekilde yapılandırıldığında uyarılar yayınlar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı servisi olarak çalışıyorsa doctor, oturum kapatıldıktan sonra gateway'in canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Pluginler ve eski dizinler)">
    Doctor, varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve izin listesi tarafından engellenmiş Skills sayılarını verir.
    - **Eski çalışma alanı dizinleri**: geçerli çalışma alanıyla birlikte `~/openclaw` veya diğer eski çalışma alanı dizinleri bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Pluginleri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Pluginleri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yükleme sırasında yayınlanan uyarı veya hataları görünür kılar.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın ya da üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir kesri olarak bildirir. Dosyalar kesildiğinde veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Bayat kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Pluginini kaldırdığında, o Plugine başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girişleri, kanalı adlandıran heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın gateway'den hâlâ ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, sekme tamamlamanın geçerli kabuk için (zsh, bash, fish veya PowerShell) kurulu olup olmadığını denetler:

    - Kabuk profili yavaş dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor bunu kurmayı ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway auth denetimleri (yerel token)">
    Doctor, yerel gateway token auth hazır olma durumunu denetler.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token` yalnızca token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkında onarımlar">
    Bazı onarım akışlarının, çalışma zamanının hızlı hata verme davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için status ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot tokenı SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor, kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve tokenı eksik olarak yanlış bildirmek ya da çökme yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    doctor komutu bir sağlık denetimi çalıştırır ve Gateway sağlıksız göründüğünde yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    doctor komutu, yapılandırılmış bellek araması embedding sağlayıcısının varsayılan aracı için hazır olup olmadığını denetler. Davranış, yapılandırılmış backend'e ve sağlayıcıya bağlıdır:

    - **QMD backend**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili yol seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel bir model dosyasını veya tanınan bir uzak/indirilebilir model URL'sini denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu kullanılabildiğinde (Gateway denetim anında sağlıklıydı), doctor komutu sonucunu CLI'den görülebilen yapılandırmayla çapraz denetler ve tutarsızlıkları belirtir. doctor komutu varsayılan yolda yeni bir embedding ping'i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor komutu bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    doctor komutu, eksik veya eski varsayılanlar (örn. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi) için kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) denetler. Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, doctor komutunu Gateway hizmet yaşam döngüsü için salt okunur tutar. Hizmet sağlığını yine de bildirir ve hizmet dışı onarımları çalıştırır, ancak harici bir supervisor bu yaşam döngüsünün sahibi olduğu için hizmet kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırması yeniden yazımları ve eski hizmet temizliğini atlar.
    - Linux'ta doctor komutu, eşleşen systemd Gateway birimi etkinken komut/entrypoint metadata'sını yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan eski olmayan ekstra Gateway benzeri birimleri yok sayar, böylece tamamlayıcı hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurma/onarma SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortamı metadata'sına kalıcı olarak yazmaz.
    - doctor komutu, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içinde gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortam değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet metadata'sını yeniden yazar.
    - doctor komutu, `gateway.port` değiştikten sonra hizmet komutu hâlâ eski bir `--port` değerini sabitlediğinde bunu algılar ve hizmet metadata'sını geçerli porta yeniden yazar.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenemiyorsa, doctor uygulanabilir rehberlikle kurulum/onarım yolunu engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulum/onarımı engeller.
    - Linux kullanıcı systemd birimleri için doctor belirteç sapması denetimleri artık hizmet kimlik doğrulama metadata'sını karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa daha eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` aracılığıyla her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılama">
    doctor komutu hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olup gerçekte çalışmadığında uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) bildirir.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    doctor komutu, Gateway hizmeti Bun üzerinde veya sürüm tarafından yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları, hizmet kabuk başlatmanızı yüklemediği için yükseltmelerden sonra bozulabilir. doctor, mevcut olduğunda sistem Node kurulumuna geçiş yapmayı önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'ları, etkileşimli kabuk PATH'ini kopyalamak yerine kanonik bir sistem PATH'i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node alt süreçlerinin çözümlendiğini değiştirmez. Linux hizmetleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı ikili dizinlerini korur, ancak tahmin edilen sürüm yöneticisi fallback dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz metadata'sı">
    doctor komutu tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz metadata'sını damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    doctor komutu, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) hakkında tam kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
