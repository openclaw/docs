---
read_when:
    - doctor geçişleri ekleme veya değiştirme
    - Uyumluluğu bozan yapılandırma değişikliklerini kullanıma sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-04T09:07:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00124eb5d85445080439d2603c65b78e85b0a2fded1cff121f21c330464f42cf
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski config/durum verilerini düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Sormadan varsayılanları kabul et (uygulanabilir olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Sormadan önerilen onarımları uygula (güvenli olduğu yerlerde onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Agresif onarımları da uygula (özel supervisor config'lerinin üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    İstemler olmadan çalıştır ve yalnızca güvenli geçişleri uygula (config normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem hizmetlerini tara (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız önce config dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'yi yeniden oluşturur).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve Plugin durumu.

  </Accordion>
  <Accordion title="Config and migrations">
    - Eski değerler için config normalleştirme.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk config geçişi.
    - Eski Chrome eklentisi config'leri ve Chrome MCP hazır olma durumu için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşul denetimi.
    - `plugins.allow` kısıtlayıcıyken ancak araç ilkesi hâlâ joker karakter veya Plugin'e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski disk üzerindeki durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşmesi anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` Webhook yedek işleri).
    - Eski ajan runtime-policy geçişi: `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`.
    - Plugin'ler etkinleştirildiğinde eski Plugin config temizliği; `plugins.enabled=false` olduğunda eski Plugin referansları etkisiz kapsama config'i olarak değerlendirilir ve korunur.

  </Accordion>
  <Accordion title="State and integrity">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş istem-yeniden-yazma dalları için oturum transcript onarımı.
    - Sıkışmış alt ajan yeniden başlatma-kurtarma tombstone algılama; başlangıcın alt öğeyi yeniden başlatma-iptal edilmiş olarak değerlendirmeye devam etmemesi için eski iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteğiyle.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transcript'ler, durum dizini).
    - Yerel olarak çalıştırılırken config dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile cooldown/devre dışı durumlarını raporlar.
    - Ek workspace dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Sandbox etkinleştirildiğinde sandbox imaj onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durumu uyarıları (çalışan Gateway'den yoklanır).
    - İsteğe bağlı onarımla supervisor config denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında kabuk `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan Gateway hizmetleri için gömülü proxy ortamı temizliği.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token oluşturmayı teklif eder; token SecretRef config'lerinin üzerine yazmaz).
    - Cihaz eşleştirme sorun algılama (bekleyen ilk kez eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-token önbellek sapması ve eşleştirilmiş kayıt kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux'ta systemd linger denetimi.
    - Workspace bootstrap dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan ajan için Skills hazır olma denetimi; eksik binary, env, config veya OS gereksinimleri olan izin verilen skills'i raporlar ve `--fix`, kullanılamayan skills'i `skills.entries` içinde devre dışı bırakabilir.
    - Kabuk tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazır olma denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm workspace uyuşmazlığı, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş config + sihirbaz metadata'sını yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Geri doldur**, **Sıfırla** ve **Grounded'ı temizle** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Geri doldur**, etkin workspace içindeki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca işaretli geri doldurma günlük girdilerini `DREAMS.md` içinden kaldırır.
- **Grounded'ı temizle**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı recall veya günlük destek biriktirmemiş, sahnelenmiş yalnızca-grounded kısa vadeli girdileri kaldırır.

Tek başlarına ne **yapmazlar**:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce sahnelenmiş CLI yolunu açıkça çalıştırmadığınız sürece grounded adayları canlı kısa vadeli yükseltme deposuna otomatik olarak sahnelemezler

Grounded geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded dayanıklı adayları kısa vadeli dreaming deposuna sahneler.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) teklif eder.
  </Accordion>
  <Accordion title="1. Config normalization">
    Config eski değer şekilleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları dahildir. Geçerli herkese açık Talk config'i `talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı haritasına yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    joker karakter veya Plugin'e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    izin listesini aşmaz.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Config kullanım dışı anahtarlar içerdiğinde diğer komutlar çalışmayı reddeder ve `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway, eski bir config biçimi algıladığında başlangıçta doctor geçişlerini de otomatik çalıştırır; böylece eski config'ler manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından ele alınır.

    Geçerli geçişler:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - adlandırılmış `accounts` değerleri olan ancak tek hesaplı üst düzey kanal değerleri kalan kanallar için, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşıyın (çoğu kanal için `accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` kaldırılır; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır (eski extension aktarma ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlatma ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları kapalı başarısız olmak yerine atlar)

    Doctor uyarıları, çok hesaplı kanallar için hesap varsayılanı kılavuzunu da içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazır olma durumu">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome extension yolunu gösteriyorsa, doctor bunu mevcut ana makine yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanan profiller için Google Chrome'un aynı ana makinede kurulu olup olmadığını kontrol eder
    - algılanan Chrome sürümünü kontrol eder ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk bağlanma onayı isteminin onaylanması

    Buradaki hazır olma durumu yalnızca yerel bağlanma ön koşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.

    Bu kontrol Docker, sandbox, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özel düzeltme kılavuzu yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile, gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski aktarım ayarlarını gördüğünde uyarır; böylece eski aktarım geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy'ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex plugin rota uyarıları">
    Paketle gelen Codex plugin etkinleştirildiğinde, doctor `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözümlenip çözümlenmediğini de kontrol eder. Bu birleşim Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden istediğinizde geçerlidir, ancak yerel Codex uygulama sunucusu düzeneğiyle karıştırılması kolaydır. Doctor uyarır ve açık uygulama sunucusu biçimine işaret eder: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik olarak onarmaz çünkü iki rota da geçerlidir:

    - `openai-codex/*` + PI, "normal OpenClaw çalıştırıcısı üzerinden Codex OAuth/abonelik kimlik doğrulamasını kullan" anlamına gelir.
    - `openai/*` + `agentRuntime.id: "codex"`, "gömülü turu yerel Codex uygulama sunucusu üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth bilinçli olarak kullanılıyorsa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, daha eski disk üstü düzenleri mevcut yapıya geçirebilir:

    - Oturumlar deposu + transkriptler:
      - `~/.openclaw/sessions/` yolundan `~/.openclaw/agents/<agentId>/sessions/` yoluna
    - Ajan dizini:
      - `~/.openclaw/agent/` yolundan `~/.openclaw/agents/<agentId>/agent/` yoluna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` dosyalarından (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` yoluna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla ve idempotent olarak yapılır; doctor eski klasörleri yedek olarak geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca geçmişin/kimlik doğrulamanın/modellerin elle doctor çalıştırması olmadan ajan başına yola yerleşmesi için başlatma sırasında eski oturumları ve ajan dizinini otomatik geçirir. WhatsApp kimlik doğrulaması bilinçli olarak yalnızca `openclaw doctor` üzerinden geçirilir. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu nedenle yalnızca anahtar sırası farkları artık tekrar eden etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski plugin manifest geçişleri">
    Doctor, tüm kurulu plugin manifestlerini kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veri yinelenmeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json`, veya geçersiz kılındığında `cron.store`) zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş biçimleri için kontrol eder.

    Mevcut cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yük `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` webhook yedek işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik geçirir. Bir iş eski bildirim yedeğini mevcut webhook olmayan bir teslim moduyla birleştiriyorsa, doctor uyarır ve bu işi elle inceleme için bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çağırdığında da uyarır. Bu ana makine yerel betik mevcut OpenClaw tarafından bakımı yapılmaz ve cron systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` mesajları yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; mevcut sağlık kontrolleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturumu dizinini eski yazma kilidi dosyaları açısından tarar — bir oturum anormal şekilde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenmiş dal biçimi için ajan oturumu JSONL dosyalarını tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı dönüşü ve aynı görünür kullanıcı istemini içeren aktif bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgün dosyanın yanına yedekler ve transkripti aktif dala yeniden yazar; böylece Gateway geçmişi ve bellek okuyucuları artık yinelenen dönüşleri görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: felaket düzeyinde durum kaybı hakkında uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu da yayar).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı hale getirmek ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlı JSONL"**: ana transkript yalnızca bir satıra sahip olduğunda işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ev dizinleri arasında birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, uzak ana makinede çalıştırmanız gerektiğini hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` olarak sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth süresi dolması)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, belirteçler süresi dolmak üzereyken/süresi dolduğunda uyarır ve güvenliyse bunları yenileyebilir. Anthropic OAuth/belirteç profili eskiyse bir Anthropic API anahtarı veya Anthropic kurulum belirteci yolunu önerir. Yenileme istemleri yalnızca etkileşimli olarak (TTY) çalışırken görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamasının gerekli olduğunu raporlar ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan kimlik doğrulama profillerini raporlar:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları)
    - daha uzun devre dışı bırakmalar (faturalandırma/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu katalog ve izin listesine göre doğrular; çözümlenmeyecekse veya izin verilmiyorsa uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandbox etkinleştirildiğinde doctor, Docker imajlarını denetler ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski kurulum-aşaması dizinlerini, daha önceki paketlenmiş Plugin bağımlılığı onarım kodundan kalan paket-yerel kalıntıları ve geçerli paketlenmiş manifesti gölgeleyebilen paketlenmiş `@openclaw/*` Plugin'lerinin sahipsiz yönetilen npm kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvurduğunda ancak yerel Plugin kayıt defteri bunları bulamadığında yapılandırılmış indirilebilir Plugin'leri de yeniden kurabilir. 2026.5.2 paketlenmiş Plugin dışsallaştırması için doctor, mevcut yapılandırmanın zaten kullandığı indirilebilir Plugin'leri otomatik olarak kurar ve ardından bu sürüm geçişini yalnızca bir kez çalıştırmak için `meta.lastTouchedVersion` değerine güvenir. Gateway başlangıcı ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/kurulum/güncelleme işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor, eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırmayı ve OpenClaw hizmetini geçerli Gateway bağlantı noktasını kullanarak kurmayı teklif eder. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlandırmalı OpenClaw Gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi Gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw Gateway hizmeti varsa, doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin; ardından yineleneni kaldırın veya Gateway yaşam döngüsünü bir sistem gözetmeni yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda, doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çabayla geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk kez eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliği onaylanmış kayıtla artık eşleşmediğinde public-key uyuşmazlığı onarımları
    - onaylanmış bir rol için aktif belirteci eksik olan eşleştirilmiş kayıtlar
    - kapsamları onaylanmış eşleştirme taban çizgisinin dışına sapan eşleştirilmiş belirteçler
    - geçerli makine için, Gateway tarafı belirteç döndürmesinden daha eski olan veya eski kapsam meta verileri taşıyan yerel önbelleğe alınmış cihaz-belirteci girdileri

    Doctor, eşleştirme isteklerini otomatik onaylamaz veya cihaz belirteçlerini otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir belirteç döndürün
    - `openclaw devices remove <deviceId>` ile eski bir kaydı kaldırın ve yeniden onaylayın

    Bu, yaygın "zaten eşleştirildi ama hâlâ eşleştirme gerekli alınıyor" boşluğunu kapatır: doctor artık ilk kez eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve eski belirteç/cihaz-kimliği sapmasından ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir ilke tehlikeli şekilde yapılandırıldığında uyarılar yayar.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway'in oturum kapatıldıktan sonra canlı kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, eksik gereksinimli ve izin listesi tarafından engellenmiş skills sayılarını sayar.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanının yanında bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defteri tarafından yükleme zamanında yayılan uyarıları veya hataları yüzeye çıkarır.

  </Accordion>
  <Accordion title="11b. Önyükleme dosyası boyutu">
    Doctor, çalışma alanı önyükleme dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilmiş bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya onun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesme yüzdesini, kesme nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir oranı olarak toplam enjekte edilmiş karakterleri raporlar. Dosyalar kesildiğinde veya sınıra yaklaştığında, doctor `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkan kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı yokken yapılandırmanın Gateway'den hâlâ ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, sekme tamamlamanın geçerli kabuk için (zsh, bash, fish veya PowerShell) kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa doctor, bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmışsa ancak önbellek dosyası eksikse doctor, önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa doctor, kurulmasını ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel belirteç)">
    Doctor, yerel Gateway belirteci kimlik doğrulama hazır oluşunu denetler.

    - Belirteç modu bir belirteç gerektiriyorsa ve belirteç kaynağı yoksa doctor bir tane oluşturmayı teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir belirteç SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkında onarımlar">
    Bazı onarım akışlarının, çalışma zamanı hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabildiğinde yapılandırılmış bot kimlik bilgilerini kullanmaya çalışır.
    - Telegram bot belirteci SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor, kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu raporlar ve belirteci eksik olarak yanlış raporlamak veya çökmek yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve sağlıksız göründüğünde gateway’i yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması gömme sağlayıcısının varsayılan ajan için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili yolu seçeneği dahil düzeltme yönergeleri yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan bir uzak/indirilebilir model URL’si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu varsa (denetim sırasında gateway sağlıklıydı), doctor bu sonucu CLI’dan görülebilen yapılandırmayla çapraz denetler ve tutarsızlıkları not eder. Doctor, varsayılan yolda yeni bir gömme ping’i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durumu komutunu kullanın.

    Çalışma zamanında gömme hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Gözetici yapılandırma denetimi + onarım">
    Doctor, kurulu gözetici yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar için denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara göre yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, gözetici yapılandırmasını yeniden yazmadan önce sorar.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem olmadan uygular.
    - `openclaw doctor --repair --force`, özel gözetici yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway hizmet yaşam döngüsü için doctor’ı salt okunur tutar. Hizmet sağlığını yine bildirir ve hizmet dışı onarımları çalıştırır, ancak bu yaşam döngüsünün sahibi dış bir gözetici olduğu için hizmet kurma/başlatma/yeniden başlatma/önyükleme, gözetici yapılandırma yeniden yazmaları ve eski hizmet temizliğini atlar.
    - Linux’ta doctor, eşleşen systemd Gateway birimi etkin durumdayken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca eşlik eden hizmet dosyalarının temizlik gürültüsü oluşturmaması için yinelenen hizmet taraması sırasında etkin olmayan, eski olmayan ek gateway benzeri birimleri yok sayar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor hizmet kurma/onarımı SecretRef’i doğrular ancak çözümlenmiş düz metin token değerlerini gözetici hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Zamanlanmış Görev kurulumlarının satır içinde gömdüğü yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve hizmet meta verilerini, bu değerler gözetici tanımı yerine çalışma zamanı kaynağından yüklenecek şekilde yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` değerine sabitlendiğini algılar ve hizmet meta verilerini geçerli porta göre yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, doctor kurulum/onarım yolunu uygulanabilir yönergelerle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için doctor token sapması denetimleri artık hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` ile her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet kabuk başlangıç dosyanızı yüklemez. Doctor, kullanılabilir olduğunda bir sistem Node kurulumuna geçiş yapmayı önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent’ları, etkileşimli kabuk PATH’ini kopyalamak yerine kurallı bir sistem PATH’i (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri Node alt süreçlerinin nasıl çözümlendiğini değiştirmez. Linux hizmetleri açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini tutmaya devam eder, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte varsa hizmet PATH’ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz meta verileri">
    Doctor, tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi için tam kılavuz olarak [/concepts/agent-workspace](/tr/concepts/agent-workspace) sayfasına bakın (önerilen: özel GitHub veya GitLab).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalıştırma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
