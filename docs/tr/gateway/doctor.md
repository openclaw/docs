---
read_when:
    - Doctor geçişleri ekleme veya değiştirme
    - Yapılandırmada geriye dönük uyumsuz değişiklikler ekleme
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık denetimleri, yapılandırma geçişleri ve onarım adımları'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durumu düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sunar.

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

    İstem yapmadan varsayılanları kabul eder (uygulanabildiğinde yeniden başlatma/hizmet/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Önerilen onarımları istem yapmadan uygular (güvenli olduğunda onarımlar + yeniden başlatmalar).

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

    İstem yapmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirme + diskteki durum taşıma). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsanız, önce yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI'yi yeniden derler).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engelli) ve Plugin durumu.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalleştirmesi.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırması geçişi.
    - Eski Chrome extension yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşul denetimi.
    - Disk üzerindeki eski durum geçişi (oturumlar/ajan dizini/WhatsApp auth).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski Cron depo geçişi (`jobId`, `schedule.cron`, üst düzey delivery/payload alanları, payload `provider`, basit `notify: true` Webhook geri dönüş işleri).
    - Eski ajan runtime-policy geçişi `agents.defaults.agentRuntime` ve `agents.list[].agentRuntime` alanlarına.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemelerinin oluşturduğu yinelenmiş istem-yeniden yazım dalları için oturum dökümü onarımı.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, dökümler, durum dizini).
    - Yerelde çalışırken yapılandırma dosyası izin denetimleri (`chmod 600`).
    - Model kimlik doğrulama sağlığı: OAuth süre sonunu denetler, süresi dolmak üzere olan belirteçleri yenileyebilir ve auth-profile bekleme süresi/devre dışı durumlarını bildirir.
    - Ek çalışma alanı dizini tespiti (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor'lar">
    - Sandbox etkin olduğunda sandbox imajı onarımı.
    - Eski hizmet geçişi ve ek gateway tespiti.
    - Matrix kanal eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan gateway'den yoklanır).
    - Supervisor yapılandırma denetimi (launchd/systemd/schtasks) ve isteğe bağlı onarım.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanılaması (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel belirteç modu için Gateway kimlik doğrulama denetimleri (belirteç kaynağı yoksa belirteç oluşturmayı önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorun tespiti (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-belirteci önbellek sapması ve eşleştirilmiş kayıt auth sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve kabuk">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı önyükleme dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
    - Shell completion durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek araması embedding sağlayıcı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD ikili dosyası).
    - Kaynak kurulumu denetimleri (pnpm workspace uyumsuzluğu, eksik UI varlıkları, eksik tsx ikili dosyası).
    - Güncellenmiş yapılandırma + sihirbaz meta verisi yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemleri kullanır, ancak `openclaw doctor` CLI onarımı/geçişinin **bir parçası değildir**.

Yaptıkları:

- **Backfill**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Reset**, yalnızca bu işaretlenmiş geri doldurma günlük girdilerini `DREAMS.md` içinden kaldırır.
- **Clear Grounded**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı geri çağırma veya günlük destek biriktirmemiş aşamalanmış yalnızca-grounded kısa vadeli girdileri kaldırır.

Tek başlarına yapmadıkları:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce açıkça aşamalı CLI yolunu çalıştırmadıkça grounded adaylarını canlı kısa vadeli yükseltme deposuna otomatik olarak aşamalamazlar

Grounded geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız, bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak korurken grounded kalıcı adayları kısa vadeli dreaming deposuna aşamalar.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalıştırmadan önce güncelleme yapmayı (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirme">
    Yapılandırma eski değer biçimleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Geçerli herkese açık Talk yapılandırması `talk.provider` + `talk.providers.<provider>` biçimindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı haritasına yeniden yazar.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway de başlangıçta eski bir yapılandırma biçimi algıladığında doctor geçişlerini otomatik çalıştırır, böylece eski yapılandırmalar manuel müdahale olmadan onarılır. Cron iş deposu geçişleri `openclaw doctor --fix` tarafından işlenir.

    Geçerli geçişler:

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
    - Adlandırılmış `accounts` içeren ama üst düzey tek hesaplı kanal değerleri kalmış kanallar için, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşı (`çoğu kanal için accounts.default`; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır (eski extension relay ayarı)

    Doctor uyarıları, çoklu hesaplı kanallar için varsayılan hesap rehberliğini de içerir:

    - `channels.<channel>.defaultAccount` veya `accounts.default` olmadan iki ya da daha fazla `channels.<channel>.accounts` girdisi yapılandırılmışsa, doctor geri dönüş yönlendirmesinin beklenmedik bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` değerlerini elle eklediyseniz, bu `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API'ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini + maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome extension yolunu gösteriyorsa, doctor bunu geçerli host-yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda host-yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome'un aynı host üzerinde kurulu olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
    - tarayıcı inspect sayfasında uzak hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor sizin yerinize Chrome tarafındaki ayarı etkinleştiremez. Host-yerel Chrome MCP için yine de şunlar gerekir:

    - gateway/node host üzerinde Chromium tabanlı bir tarayıcı 144+
    - tarayıcının yerelde çalışıyor olması
    - o tarayıcıda uzak hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk bağlanma onay isteminin kabul edilmesi

    Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session, geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar yine de yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, remote-browser veya diğer başsız akışlar için **geçerli değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yokalma sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya self-signed sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanan macOS'te çözüm genellikle `brew postinstall ca-certificates` olur. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce eski OpenAI taşıma ayarlarını `models.providers.openai-codex` altına eklediyseniz, bunlar yeni sürümlerin otomatik kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski taşıma ayarlarını gördüğünde, eski taşıma geçersiz kılmasını kaldırabilmeniz veya yeniden yazabilmeniz ve yerleşik yönlendirme/geri dönüş davranışını geri alabilmeniz için uyarır. Özel proxy'ler ve yalnızca üstbilgi geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex Plugin rota uyarıları">
    Paketlenmiş Codex Plugin'i etkin olduğunda, doctor ayrıca `openai-codex/*` birincil model başvurularının hâlâ varsayılan PI çalıştırıcısı üzerinden çözümlenip çözümlenmediğini denetler. Codex OAuth/abonelik kimlik doğrulamasını PI üzerinden kullanmak istediğinizde bu birleşim geçerlidir, ancak bunu yerel Codex app-server harness ile karıştırmak kolaydır. Doctor uyarır ve açık app-server biçimine işaret eder: `openai/*` artı `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor bunu otomatik onarmaz çünkü her iki rota da geçerlidir:

    - `openai-codex/*` + PI, "Codex OAuth/abonelik kimlik doğrulamasını normal OpenClaw çalıştırıcısı üzerinden kullan" anlamına gelir.
    - `openai/*` + `runtime: "codex"`, "gömülü turu yerel Codex app-server üzerinden çalıştır" anlamına gelir.
    - `/codex ...`, "yerel bir Codex konuşmasını sohbetten denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

    Uyarı görünürse, amaçladığınız rotayı seçin ve yapılandırmayı elle düzenleyin. PI Codex OAuth kasıtlıysa uyarıyı olduğu gibi bırakın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, eski disk düzenlerini geçerli yapıya taşıyabilir:

    - Oturum deposu + dökümler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp auth durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba düzeyindedir ve idempotent'tir; doctor, herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar verir. Gateway/CLI ayrıca başlangıçta eski oturumlar + ajan dizinini otomatik taşır; böylece geçmiş/auth/models elle doctor çalıştırmadan ajan başına yola yerleşir. WhatsApp auth kasıtlı olarak yalnızca `openclaw doctor` aracılığıyla taşınır. Talk provider/provider-map normalleştirmesi artık yapısal eşitlikle karşılaştırma yapar; böylece yalnızca anahtar sırası farkları artık tekrar eden etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, tüm kurulu Plugin manifestlerinde kullanımdan kaldırılmış üst düzey yetenek anahtarlarını (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı önerir ve manifest dosyasını yerinde yeniden yazar. Bu geçiş idempotent'tir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veriyi yinelemeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski Cron depo geçişleri">
    Doctor ayrıca uyumluluk için zamanlayıcının hâlâ kabul ettiği eski iş şekilleri açısından Cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json`, veya geçersiz kılınmışsa `cron.store`) denetler.

    Geçerli Cron temizlikleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey delivery alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery takma adları → açık `delivery.channel`
    - basit eski `notify: true` Webhook geri dönüş işleri → açık `delivery.mode="webhook"` ve `delivery.to=cron.webhook`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik taşır. Bir iş eski notify geri dönüşünü mevcut Webhook olmayan bir teslim modu ile birleştiriyorsa, doctor uyarır ve o işi manuel inceleme için bırakır.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, her ajan oturum dizinini eski yazma kilidi dosyaları açısından tarar — oturum anormal şekilde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID veya 30 dakikadan eski). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik kaldırır; aksi halde bir not yazar ve sizden `--fix` ile yeniden çalıştırmanızı ister.
  </Accordion>
  <Accordion title="3d. Oturum dökümü dal onarımı">
    Doctor, 2026.4.24 istem dökümü yeniden yazım hatasının oluşturduğu yinelenmiş dal biçimi için ajan oturum JSONL dosyalarını tarar: OpenClaw iç çalışma zamanı bağlamı içeren terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı istemini içeren etkin bir kardeş dal. `--fix` / `--repair` modunda, doctor etkilenen her dosyayı özgünün yanına yedekler ve dökümü etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa, yedekleriniz başka bir yerde yoksa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz.

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı önerir ve eksik verileri geri getiremeyeceğini hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir (ve sahip/grup uyumsuzluğu algılandığında `chown` ipucu verir).
    - **macOS bulut eşzamanlı durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşzaman destekli yollar daha yavaş G/Ç ve kilit/eşzaman yarışlarına yol açabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazımları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum depo dizini gereklidir.
    - **Döküm uyumsuzluğu**: son oturum girdilerinin eksik döküm dosyaları olduğunda uyarır.
    - **Ana oturum "tek satır JSONL"**: ana döküm yalnızca bir satıra sahipse işaretler (geçmiş birikmiyor demektir).
    - **Birden fazla durum dizini**: birden fazla home dizini arasında birden çok `~/.openclaw` klasörü varsa veya `OPENCLAW_STATE_DIR` başka bir yeri işaret ediyorsa uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatması**: `gateway.mode=remote` ise doctor, bunu uzak host üzerinde çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600`'e sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model auth sağlığı (OAuth süresinin dolması)">
    Doctor, auth deposundaki OAuth profillerini inceler, belirteçlerin süresi dolmak üzereyse veya dolmuşsa uyarır ve güvenliyse yenileyebilir. Anthropic OAuth/token profili eskiyse, Anthropic API anahtarı veya Anthropic kurulum-belirteci yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulama gerektiğini bildirir ve çalıştırmanız gereken tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

    - kısa bekleme süreleri (oran sınırları/zaman aşımları/auth hataları)
    - daha uzun devre dışı kalmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa, doctor model başvurusunu kataloğa ve izin listesine göre doğrular ve çözülmeyecekse veya izin verilmiyorsa uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandbox etkin olduğunda doctor Docker imajlarını denetler ve geçerli imaj eksikse eski adları derlemeyi veya bunlara geçmeyi önerir.
  </Accordion>
  <Accordion title="7b. Paketlenmiş Plugin çalışma zamanı bağımlılıkları">
    Doctor, çalışma zamanı bağımlılıklarını yalnızca geçerli yapılandırmada etkin olan veya paketlenmiş manifest varsayılanıyla etkinleşen paketlenmiş Plugin'ler için doğrular; örneğin `plugins.entries.discord.enabled: true`, eski `channels.discord.enabled: true` veya varsayılan olarak etkin bir paketlenmiş sağlayıcı. Herhangi biri eksikse, doctor paketleri bildirir ve `openclaw doctor --fix` / `openclaw doctor --repair` modunda bunları kurar. Harici Plugin'ler hâlâ `openclaw plugins install` / `openclaw plugins update` kullanır; doctor rastgele Plugin yolları için bağımlılık kurmaz.

    Gateway ve yerel CLI de, paketlenmiş bir Plugin'i içe aktarmadan önce etkin paketlenmiş Plugin çalışma zamanı bağımlılıklarını isteğe bağlı olarak onarabilir. Bu kurulumlar Plugin çalışma zamanı kurulum köküyle sınırlıdır, betikler devre dışı olarak çalışır, paket kilidi yazmaz ve eşzamanlı CLI veya Gateway başlangıçlarının aynı `node_modules` ağacını aynı anda değiştirmemesi için bir kurulum-kökü kilidi ile korunur.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizlik ipuçları">
    Doctor eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway portunu kullanan OpenClaw hizmetini kurmayı önerir. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizlik ipuçları yazdırabilir. Profile göre adlandırılmış OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.
  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya uygulanabilir bir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve sonra en iyi çaba düzeyindeki geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli-durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve auth sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliği artık onaylı kayıtla eşleşmediğinde public key uyumsuzluğu onarımları
    - onaylı bir rol için etkin belirteci eksik eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temelinin dışına kayan eşleştirilmiş belirteçler
    - geçerli makine için gateway tarafındaki belirteç döndürmeden önceye ait olan veya eski kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-belirteci girdileri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz belirteçlerini otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir belirteci `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşleştirilmiş ama hâlâ eşleştirme gerekli alıyor" boşluğunu kapatır: doctor artık ilk eşleştirmeyi, bekleyen rol/kapsam yükseltmelerini ve eski belirteç/cihaz-kimliği sapmasını birbirinden ayırır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açıksa veya bir ilke tehlikeli şekilde yapılandırılmışsa uyarılar verir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd kullanıcı hizmeti olarak çalışıyorsa doctor, oturum kapatıldıktan sonra gateway'in canlı kalması için lingering'in etkin olduğunu doğrular.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimi eksik ve izin listesi tarafından engellenmiş Skills sayıları.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanıyla birlikte varsa uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin sayılarını verir; hatası olanlar için Plugin kimliklerini listeler; paket Plugin yeteneklerini bildirir.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defterinin yükleme sırasında verdiği tüm uyarı veya hataları gösterir.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya bunun üzerinde olup olmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kesilme yüzdesini, kesilme nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterleri toplam bütçenin bir oranı olarak bildirir. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarının nasıl düzenleneceğine dair ipuçları yazdırır.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor, geçerli shell için sekme tamamlamanın kurulu olup olmadığını denetler (zsh, bash, fish veya PowerShell):

    - Shell profili yavaş bir dinamik tamamlama deseni kullanıyorsa (`source <(openclaw completion ...)`), doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ama önbellek dosyası eksikse, doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa, kurmayı önerir (yalnızca etkileşimli modda; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway auth denetimleri (yerel belirteç)">
    Doctor, yerel gateway belirteç auth hazırlığını denetler.

    - Belirteç modu bir belirteç gerektiriyorsa ve belirteç kaynağı yoksa, doctor bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef ile yönetiliyorsa ama kullanılamıyorsa, doctor uyarır ve bunun üzerine düz metin yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca yapılandırılmış bir token SecretRef yoksa zorunlu oluşturma yapar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkındalıklı onarımlar">
    Bazı onarım akışlarının çalışma zamanı fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedeflenmiş yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, varsa yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot belirteci SecretRef ile yapılandırılmış ama geçerli komut yolunda kullanılamıyorsa, doctor belirteci eksik olarak çökmeden veya yanlış bildirip geçmeden, kimlik bilgisinin yapılandırılmış ama kullanılamaz olduğunu bildirir ve otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması embedding sağlayıcısının varsayılan ajan için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uç ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikili dosyasının mevcut ve başlatılabilir olup olmadığını yoklar. Değilse npm paketi ve elle ikili dosya yolu seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyasını veya tanınmış bir uzak/indirilebilir model URL'sini denetler. Eksikse uzak sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya auth deposunda bir API anahtarının mevcut olduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, sonra otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Bir gateway yoklama sonucu mevcut olduğunda (denetim sırasında gateway sağlıklıysa), doctor bunu CLI tarafından görülebilen yapılandırmayla çapraz başvurur ve herhangi bir uyumsuzluğu not eder.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durum uyarıları">
    Gateway sağlıklıysa doctor bir kanal durum yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarılar bildirir.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarımı">
    Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar açısından denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Uyuşmazlık bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlara göre yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem yapmadan uygular.
    - `openclaw doctor --repair --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, doctor'u gateway hizmet yaşam döngüsü için salt okunur tutar. Hizmet sağlığını yine bildirir ve hizmet dışı onarımları çalıştırır, ancak o yaşam döngüsünün sahibi harici bir supervisor olduğundan hizmet kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazımları ve eski hizmet temizliğini atlar.
    - Belirteç auth bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa, doctor hizmet kurma/onarımı SecretRef'i doğrular ama çözümlenmiş düz metin belirteç değerlerini supervisor hizmet ortam meta verisine kalıcı yazmaz.
    - Belirteç auth bir belirteç gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, doctor kurma/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurma/onarımı engeller.
    - Linux user-systemd birimleri için doctor belirteç sapması denetimleri artık hizmet auth meta verisini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor hizmet onarımları, yapılandırma son olarak daha yeni bir sürüm tarafından yazılmışsa, eski bir OpenClaw ikili dosyasından gelen gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Her zaman `openclaw gateway install --force` ile tam yeniden yazımı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılaması">
    Doctor hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet kurulu ama gerçekte çalışmıyorsa uyarır. Ayrıca gateway portundaki (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, gateway hizmeti Bun üzerinde veya sürüm yöneticili bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalışıyorsa uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü hizmet shell init'inizi yüklemez. Doctor, varsa sistem Node kurulumuna geçmeyi önerir (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verisi">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalışmasını kaydetmek için sihirbaz meta verisini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksikse bir çalışma alanı bellek sistemi önerir ve çalışma alanı henüz git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) için tam kılavuz olarak bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
