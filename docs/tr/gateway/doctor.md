---
read_when:
    - doctor migrasyonları ekleme veya değiştirme
    - Geriye uyumsuz yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-02T20:44:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + migration aracıdır. Eski config/state verilerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul eder (uygulanabilir olduğunda yeniden başlatma/servis/sandbox onarım adımları dahil).

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

    Agresif onarımları da uygular (özel supervisor config değerlerinin üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    İstemler olmadan çalışır ve yalnızca güvenli migration işlemlerini uygular (config normalleştirme + diskteki state taşıma). İnsan onayı gerektiren yeniden başlatma/servis/sandbox eylemlerini atlar. Legacy state migration işlemleri algılandığında otomatik çalışır.

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
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'ı yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config ve migration işlemleri">
    - Legacy değerler için config normalleştirme.
    - Talk config migration işlemi: legacy düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına.
    - Legacy Chrome uzantısı config değerleri ve Chrome MCP hazırlığı için tarayıcı migration denetimleri.
    - OpenCode sağlayıcı override uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth shadowing uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya Plugin-owned araçlar istediğinde Plugin/araç allowlist uyarıları.
    - Legacy disk üstü state migration işlemi (oturumlar/ajan dizini/WhatsApp auth).
    - Legacy Plugin manifest sözleşme anahtarı migration işlemi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Legacy Cron store migration işlemi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` Webhook fallback işleri).
    - Legacy ajan runtime-policy migration işlemi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkin olduğunda eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları etkisiz containment config olarak değerlendirilir ve korunur.

  </Accordion>
  <Accordion title="State ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 build'lerinin oluşturduğu yinelenmiş prompt-rewrite dalları için oturum transcript onarımı.
    - Takılı subagent yeniden başlatma-kurtarma tombstone algılama; `--fix` desteğiyle eski iptal edilmiş kurtarma flag'lerini temizleyerek başlangıcın child öğesini yeniden başlatma-iptal edilmiş olarak değerlendirmeye devam etmesini önler.
    - State bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, state dizini).
    - Yerel çalıştırmada config dosyası izin denetimleri (chmod 600).
    - Model auth sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını raporlar.
    - Ek workspace dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servisler ve supervisor'lar">
    - Sandbox etkinleştirildiğinde sandbox image onarımı.
    - Legacy servis migration işlemi ve ek gateway algılama.
    - Matrix kanalı legacy state migration işlemi (`--fix` / `--repair` modunda).
    - Gateway runtime denetimleri (servis kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan gateway üzerinden yoklanır).
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan gateway servisleri için gömülü proxy ortamı temizliği.
    - Gateway runtime en iyi uygulama denetimleri (Node vs Bun, version-manager yolları).
    - Gateway port çakışması tanılaması (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, güvenlik ve pairing">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway auth denetimleri (token kaynağı yoksa token üretimi önerir; token SecretRef config değerlerinin üzerine yazmaz).
    - Cihaz pairing sorun algılaması (bekleyen ilk kez pair istekleri, bekleyen rol/scope yükseltmeleri, eski yerel device-token cache drift'i ve paired-record auth drift'i).

  </Accordion>
  <Accordion title="Workspace ve shell">
    - Linux'ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (context dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan ajan için Skills hazırlık denetimi; eksik bin, env, config veya OS gereksinimleri olan izinli skills öğelerini raporlar ve `--fix`, kullanılamayan skills öğelerini `skills.entries` içinde devre dışı bırakabilir.
    - Shell tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Memory arama embedding sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm workspace uyumsuzluğu, eksik UI asset'leri, eksik tsx binary).
    - Güncellenmiş config + sihirbaz metadata yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/migration kapsamının parçası **değildir**.

Ne yaparlar:

- **Backfill**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir backfill girişlerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca işaretlenmiş bu backfill günlük girişlerini `DREAMS.md` içinden kaldırır.
- **Clear Grounded**, yalnızca geçmiş replay'den gelen ve henüz canlı recall veya günlük destek biriktirmemiş staged grounded-only kısa vadeli girişleri kaldırır.

Tek başlarına **yapmadıkları** şeyler:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor migration işlemlerini çalıştırmazlar
- staged CLI yolunu açıkça önce çalıştırmadıkça grounded adayları otomatik olarak canlı kısa vadeli promotion store içine stage etmezler

Grounded geçmiş replay'in normal deep promotion hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak korurken grounded durable adayları kısa vadeli dreaming store içine stage eder.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Config normalleştirme">
    Config legacy değer şekilleri içeriyorsa (örneğin kanala özgü override olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna legacy Talk düz alanları da dahildir. Geçerli genel Talk config değeri `talk.provider` + `talk.providers.<provider>` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı haritasına yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi joker karakter
    veya Plugin-owned araç girişleri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    allowlist değerini atlamaz.

  </Accordion>
  <Accordion title="2. Legacy config anahtarı migration işlemleri">
    Config kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi legacy anahtarların bulunduğunu açıklar.
    - Uyguladığı migration işlemini gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway de legacy config formatı algıladığında başlangıçta doctor migration işlemlerini otomatik çalıştırır, böylece eski config değerleri manuel müdahale olmadan onarılır. Cron iş store migration işlemleri `openclaw doctor --fix` tarafından ele alınır.

    Geçerli migration işlemleri:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Adlandırılmış `accounts` içeren ancak üst düzey tek hesap kanal değerleri kalan kanallar için, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` öğesini kaldırın; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` öğesini kaldırın (eski uzantı geçiş ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı başarısız olmak yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı rehberliğini de içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi, `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa doctor, yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğesini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor uyarır; böylece geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilirsiniz.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantı yolunu gösteriyorsa doctor, bunu mevcut ana makine yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı ana makinede kurulu olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışması
    - bu tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk bağlanma onayı isteminin onaylanması

    Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session, mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, remote-browser veya diğer headless akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS'te düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile yoklama, Gateway sağlıklı olsa bile çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI taşıma ayarları eklediyseniz, bunlar daha yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde uyarır; böylece bayat taşıma geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca üst bilgi geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex Plugin rota uyarıları">
    Paketlenmiş Codex Plugin etkinleştirildiğinde doctor, `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözülüp çözülmediğini de denetler. PI üzerinden Codex OAuth/abonelik kimlik doğrulaması istediğinizde bu birleşim geçerlidir, ancak yerel Codex uygulama sunucusu altyapısıyla karıştırılması kolaydır. Doctor uyarır ve açık uygulama sunucusu biçimini gösterir: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI, "Codex OAuth/abonelik kimlik doğrulamasını normal OpenClaw çalıştırıcısı üzerinden kullan" anlamına gelir.
    - `openai/*` + `agentRuntime.id: "codex"`, "gömülü turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth kasıtlıysa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, eski disk üzeri düzenleri mevcut yapıya geçirebilir:

    - Oturum deposu + dökümler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla yapılır ve idempotenttir; doctor, yedek olarak herhangi bir eski klasörü geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumları ve ajan dizinini otomatik olarak geçirir; böylece geçmiş/kimlik doğrulama/modeller, elle doctor çalıştırmaya gerek kalmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` aracılığıyla geçirilir. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu nedenle yalnızca anahtar sırası farkları artık tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için kurulu tüm Plugin manifestlerini tarar. Bulduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri yinelenmeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri açısından denetler.

    Mevcut cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak geçirir. Bir iş eski notify yedeğini mevcut webhook olmayan bir teslim moduyla birleştiriyorsa doctor uyarır ve o işi elle inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çağırdığında da uyarır. Bu ana makine yerel betik mevcut OpenClaw tarafından bakımı yapılan bir betik değildir ve cron systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` mesajları yazabilir. Bayat crontab girdisini `crontab -e` ile kaldırın; mevcut sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturumu dizinini eski yazma kilidi dosyaları için tarar — bir oturum anormal şekilde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID’nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan daha eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için ajan oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır, çünkü eşitleme destekli yollar daha yavaş G/Ç’ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır, çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptin yalnızca bir satırı olduğunda işaretler (geçmiş birikmiyor).
    - **Birden çok durum dizini**: ev dizinleri arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolma)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, belirteçlerin süresi dolmak üzereyse veya dolmuşsa uyarır ve güvenliyse bunları yenileyebilir. Anthropic OAuth/belirteç profili eskiyse bir Anthropic API anahtarı veya Anthropic kurulum belirteci yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu katalog ve izin listesine karşı doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imaj onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker imajlarını denetler ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum-aşaması dizinlerini ve önceki paketli Plugin bağımlılığı onarım kodundan kalan paket-yerel kalıntıları kapsar.

    Doctor, yapılandırma bunlara başvurduğunda ancak yerel Plugin kayıt defteri bunları bulamadığında yapılandırılmış indirilebilir Pluginleri de yeniden kurabilir. 2026.5.2 paketli Plugin dışsallaştırması için doctor, mevcut yapılandırmanın zaten kullandığı indirilebilir Pluginleri otomatik olarak kurar ve ardından bu sürüm geçişini yalnızca bir kez çalıştırmak için `meta.lastTouchedVersion` değerine güvenir. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor, eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli Gateway bağlantı noktasını kullanarak OpenClaw hizmetini kurmayı teklif eder. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux’ta kullanıcı düzeyi Gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw Gateway hizmeti varsa doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin, ardından yineleneni kaldırın veya Gateway yaşam döngüsünü bir sistem süpervizörü yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama kayması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdiği şeyler:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliğinin artık onaylanmış kayıtla eşleşmediği açık anahtar uyuşmazlığı onarımları
    - onaylanmış bir rol için etkin belirteci eksik eşleştirilmiş kayıtlar
    - kapsamları onaylanmış eşleştirme temel çizgisinin dışına kayan eşleştirilmiş belirteçler
    - geçerli makine için Gateway tarafı belirteç rotasyonundan önce gelen veya eski kapsam meta verileri taşıyan yerel önbelleğe alınmış cihaz-belirteci girdileri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz belirteçlerini otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir belirteç döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirilmiş ama hâlâ eşleştirme gerekli alıyor" açığını kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski belirteç/cihaz-kimliği kaymasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan doğrudan mesajlara açık olduğunda veya bir ilke tehlikeli biçimde yapılandırıldığında uyarılar verir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway’in çıkıştan sonra canlı kalması için linger’ın etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Pluginler ve eski dizinler)">
    Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve izin listesi tarafından engellenmiş Skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: geçerli çalışma alanının yanında `~/openclaw` veya başka eski çalışma alanı dizinleri bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Pluginleri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Pluginleri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yayılan yükleme zamanı uyarılarını veya hatalarını yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya başka enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya bunun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilen karakterleri toplam bütçenin bir kesri olarak bildirir. Dosyalar kesildiğinde veya sınıra yakın olduğunda doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Pluginini kaldırdığında, o Plugine başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı gitmişken yapılandırmanın hâlâ Gateway’den buna bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmışsa ancak önbellek dosyası eksikse doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor bunu kurmayı sorar (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel belirteç)">
    Doctor, yerel Gateway belirteç kimlik doğrulama hazır oluşunu denetler.

    - Belirteç modu bir belirteç gerektiriyorsa ve hiçbir belirteç kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token` yalnızca hiçbir belirteç SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkındalıklı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabilir olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot belirteci SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor, kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve belirteci eksik olarak bildirip çökme veya yanlış raporlama yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve sağlıksız göründüğünde gateway’i yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması embedding sağlayıcısının varsayılan agent için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve elle ikili yolu seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel bir model dosyası veya tanınan uzak/indirilebilir model URL’si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, sonra otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir gateway yoklama sonucu mevcut olduğunda (denetim sırasında gateway sağlıklıydı), doctor bu sonucu CLI’den görülebilen yapılandırmayla karşılaştırır ve tutarsızlıkları not eder. Doctor, varsayılan yolda yeni bir embedding pingi başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarımı">
    Doctor, yüklü supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar açısından denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gateway hizmet yaşam döngüsü için doctor’ı salt okunur tutar. Hizmet sağlığını yine bildirir ve hizmet dışı onarımları çalıştırır, ancak harici bir supervisor bu yaşam döngüsüne sahip olduğu için hizmet kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazmaları ve eski hizmet temizliğini atlar.
    - Linux’ta doctor, eşleşen systemd gateway birimi etkin durumdayken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan eski olmayan ek gateway benzeri birimleri yok sayar; böylece yardımcı hizmet dosyaları temizlik gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa, doctor hizmet kurulumu/onarımı SecretRef’i doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içine gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` sabitlediğini algılar ve hizmet meta verilerini geçerli porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, doctor uygulanabilir rehberlikle kurulum/onarım yolunu engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulum/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor token sapması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet yüklü olduğu hâlde gerçekte çalışmıyorsa uyarır. Ayrıca gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, gateway hizmeti Bun üzerinde veya sürüm yönetimli bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları, hizmet kabuk başlatmanızı yüklemediği için yükseltmelerden sonra bozulabilir. Doctor, mevcut olduğunda sistem Node kurulumuna geçiş önerir (Homebrew/apt/choco).

    Yeni yüklenen veya onarılan macOS LaunchAgent’ları etkileşimli kabuk PATH’ini kopyalamak yerine kanonik bir sistem PATH’i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri hangi Node alt süreçlerinin çözümleneceğini değiştirmez. Linux hizmetleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini tutar; ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda hizmet PATH’ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz meta verileri">
    Doctor, tüm yapılandırma değişikliklerini kalıcılaştırır ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen özel GitHub veya GitLab) hakkında eksiksiz kılavuz için [/concepts/agent-workspace](/tr/concepts/agent-workspace) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
