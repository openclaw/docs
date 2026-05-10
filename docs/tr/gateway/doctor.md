---
read_when:
    - doctor geçişleri ekleme veya değiştirme
    - Uyumluluğu bozan yapılandırma değişikliklerini tanıtma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-05-10T19:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Eski yapılandırma/durum verilerini düzeltir, sağlık denetimleri yapar ve uygulanabilir onarım adımları sağlar.

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

    Varsayılanları sormadan kabul et (uygun olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dahil).

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

    Agresif onarımları da uygula (özel supervisor yapılandırmalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    İstemler olmadan çalıştır ve yalnızca güvenli geçişleri uygula (yapılandırma normalleştirme + diskteki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tara (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri gözden geçirmek istiyorsanız önce yapılandırma dosyasını açın:

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
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalleştirme.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırması geçişi.
    - Eski Chrome eklentisi yapılandırmaları ve Chrome MCP hazır olma durumu için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcı geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth gölgeleme uyarıları (`models.providers.openai-codex`).
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken ancak araç ilkesi hâlâ joker karakter veya Plugin'e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Eski diskteki durum geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski Cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, basit `notify: true` webhook yedek işleri).
    - Eski tüm ajan çalışma zamanı ilkesi temizliği; sağlayıcı/model çalışma zamanı ilkesi etkin rota seçicidir.
    - Plugin'ler etkinleştirildiğinde eski Plugin yapılandırması temizliği; `plugins.enabled=false` olduğunda eski Plugin başvuruları etkisiz kapsama yapılandırması olarak kabul edilir ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve eski kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-yeniden-yazma dalları için oturum transkript onarımı.
    - Başlangıcın alt öğeyi yeniden başlatma nedeniyle iptal edilmiş olarak değerlendirmeye devam etmemesi için eski iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteğiyle, takılmış alt ajan yeniden başlatma-kurtarma tombstone algılama.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transkriptler, durum dizini).
    - Yerel olarak çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan token'ları yenileyebilir ve auth-profile bekleme süresi/devre dışı durumlarını raporlar.
    - Ek çalışma alanı dizini algılama (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisor'lar">
    - Sandbox etkinleştirildiğinde sandbox imajı onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan Gateway'den yoklanır).
    - Kanala özgü izin denetimleri `openclaw channels capabilities` altında bulunur; örneğin Discord ses kanalı izinleri `openclaw channels capabilities --channel discord --target channel:<channel-id>` ile denetlenir.
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway olay döngüsü sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modeller, yedekler, Heartbeat/alt ajan/Compaction geçersiz kılmaları, hook'lar, kanal model geçersiz kılmaları ve oturum rota sabitlemeleri içindeki eski `openai-codex/*` model başvuruları için Codex rota onarımı; `--fix` bunları `openai/*` olarak yeniden yazar, eski oturum/tüm ajan çalışma zamanı sabitlemelerini kaldırır ve kanonik OpenAI ajan başvurularını varsayılan Codex harness üzerinde bırakır.
    - İsteğe bağlı onarımla supervisor yapılandırma denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında kabuk `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalamış Gateway hizmetleri için gömülü proxy ortamı temizliği.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node vs Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token oluşturma önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleme sorunu algılama (bekleyen ilk eşleme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz-token önbelleği kayması ve eşlenmiş kayıt kimlik doğrulama kayması).

  </Accordion>
  <Accordion title="Çalışma alanı ve kabuk">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı bootstrap dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan ajan için Skills hazır olma denetimi; eksik binary, ortam, yapılandırma veya işletim sistemi gereksinimleri olan izinli skill'leri raporlar ve `--fix`, kullanılamayan skill'leri `skills.entries` içinde devre dışı bırakabilir.
    - Kabuk tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek arama embedding sağlayıcısı hazır olma denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyuşmazlığı, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş yapılandırma + sihirbaz metadata'sı yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, temellendirilmiş dreaming iş akışı için **Geri Doldur**, **Sıfırla** ve **Temellendirileni Temizle** eylemlerini içerir. Bu eylemler Gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarım/geçişinin parçası **değildir**.

Ne yaparlar:

- **Geri Doldur**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, temellendirilmiş REM günlük geçişini çalıştırır ve tersine çevrilebilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca bu işaretlenmiş geri doldurma günlük girdilerini `DREAMS.md` dosyasından kaldırır.
- **Temellendirileni Temizle**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı recall veya günlük destek biriktirmemiş aşamalandırılmış yalnızca temellendirilmiş kısa vadeli girdileri kaldırır.

Kendi başlarına ne yapmazlar:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- önce aşamalandırılmış CLI yolunu açıkça çalıştırmadığınız sürece temellendirilmiş adayları canlı kısa vadeli yükseltme deposuna otomatik olarak aşamalandırmazlar

Temellendirilmiş geçmiş yeniden oynatmanın normal derin yükseltme hattını etkilemesini istiyorsanız bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak korurken temellendirilmiş dayanıklı adayları kısa vadeli dreaming deposuna aşamalandırır.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirme">
    Yapılandırma eski değer şekilleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları geçerli şemaya normalleştirir.

    Buna eski Talk düz alanları dahildir. Geçerli genel Talk konuşma yapılandırması `talk.provider` + `talk.providers.<provider>` şeklindedir ve gerçek zamanlı ses yapılandırması `talk.realtime.*` şeklindedir. Doctor eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini sağlayıcı eşlemine yeniden yazar ve eski üst düzey gerçek zamanlı seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş olmadığında ve araç ilkesi
    joker karakter veya Plugin'e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca
    gerçekten yüklenen Plugin'lerden gelen araçlarla eşleşir; özel Plugin
    izin listesini atlamaz. Doctor, mevcut paketli sağlayıcı davranışını korumak için geçirilmiş
    eski izin listesi yapılandırmalarına `plugins.bundledDiscovery: "compat"` yazar ve
    ardından daha katı `"allowlist"` ayarına işaret eder.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway başlangıcı eski yapılandırma biçimlerini reddeder ve sizden `openclaw doctor --fix` çalıştırmanızı ister; başlangıçta `openclaw.json` dosyasını yeniden yazmaz. Cron iş deposu geçişleri de `openclaw doctor --fix` tarafından ele alınır.

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
    - Adlandırılmış `accounts` içeren ancak üst düzey tek hesap kanal değerleri kalan kanallarda, bu hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşıyın (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` kaldırılır; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır (eski uzantı aktarma ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcılarda kapalı başarısız olmak yerine bu sağlayıcıları atlar)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` kaldırılır; Codex app-server, Codex’e özgü çalışma alanı araçlarını her zaman yerel tutar

    Doctor uyarıları ayrıca çok hesaplı kanallar için hesap varsayılanı rehberliği içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa doctor, yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` değerini elle eklediyseniz bu, `@mariozechner/pi-ai` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu durum modelleri yanlış API’ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazırlığı">
    Tarayıcı yapılandırmanız hâlâ kaldırılan Chrome uzantı yolunu gösteriyorsa doctor bunu geçerli ana makine yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerel Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome’un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144’ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin yerinize etkinleştiremez. Ana makine yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/düğüm ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkin olması
    - tarayıcıdaki ilk bağlanma onay istemini onaylama

    Buradaki hazırlık yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini doğrulamak için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme rehberliği yazdırır. Homebrew Node kullanılan macOS’ta düzeltme genellikle `brew postinstall ca-certificates` olur. `--deep` ile yoklama, Gateway sağlıklı olsa bile çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz bunlar, daha yeni sürümlerin otomatik kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, eski aktarım geçersiz kılmasını kaldırabilmeniz veya yeniden yazabilmeniz ve yerleşik yönlendirme/yedek davranışını geri alabilmeniz için Codex OAuth ile birlikte bu eski aktarım ayarlarını gördüğünde uyarır. Özel proxy’ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex rota onarımı">
    Doctor eski `openai-codex/*` model ref’lerini denetler. Yerel Codex harness yönlendirmesi kanonik `openai/*` model ref’lerini kullanır; OpenAI agent dönüşleri OpenClaw PI OpenAI yolu yerine Codex app-server harness üzerinden geçer.

    `--fix` / `--repair` modunda doctor, birincil modeller, yedekler, heartbeat/subagent/compaction geçersiz kılmaları, kancalar, kanal model geçersiz kılmaları ve eski kalıcı oturum rota durumu dahil etkilenen varsayılan agent ve agent başına ref’leri yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Codex amacı, onarılan agent model ref’leri için sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşınır; böylece model ref’i `openai/*` olduktan sonra `openai-codex:...` auth profilleri hâlâ seçilebilir.
    - Çalışma zamanı seçimi sağlayıcı/model kapsamlı olduğu için eski tüm agent çalışma zamanı yapılandırması ve kalıcı oturum çalışma zamanı sabitlemeleri kaldırılır.
    - Onarılan eski model ref’inin eski auth yolunu korumak için Codex yönlendirmesine ihtiyaç duyması dışında mevcut sağlayıcı/model çalışma zamanı ilkesi korunur.
    - Mevcut model yedek listeleri, eski girdileri yeniden yazılarak korunur; kopyalanan model başına ayarlar eski anahtardan kanonik `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri ve auth profili sabitlemeleri keşfedilen tüm agent oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Oturum rota temizliği">
    Doctor ayrıca yapılandırılmış modelleri veya çalışma zamanını Codex gibi Plugin sahipli bir rotadan uzaklaştırdıktan sonra eski otomatik oluşturulmuş rota durumu için keşfedilen agent oturum depolarını tarar.

    `openclaw doctor --fix`, sahip olan rotaları artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, çalışma zamanı model meta verileri, sabitlenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik auth profili geçersiz kılmaları gibi otomatik oluşturulmuş eski durumları temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri elle inceleme için raporlanır ve dokunulmadan bırakılır; o rota artık istenmiyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor eski disk üzeri düzenleri geçerli yapıya geçirebilir:

    - Oturumlar deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Agent dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp auth durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çabayla yapılır ve idempotent’tir; doctor, yedek olarak herhangi bir eski klasörü geride bıraktığında uyarılar yayar. Gateway/CLI ayrıca başlangıçta eski oturumları + agent dizinini otomatik geçirir; böylece geçmiş/auth/modeller elle doctor çalıştırmadan agent başına yola yerleşir. WhatsApp auth özellikle yalnızca `openclaw doctor` aracılığıyla geçirilir. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır; bu nedenle yalnızca anahtar sırası farkları artık tekrar eden etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski Plugin manifest geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tüm yüklü Plugin manifestlerini tarar. Bulunduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotent’tir; `contracts` anahtarı zaten aynı değerlere sahipse eski anahtar veri çoğaltılmadan kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron depo geçişleri">
    Doctor ayrıca zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri için cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) denetler.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` teslim takma adları → açık `delivery.channel`
    - basit eski `notify: true` Webhook geri dönüş işleri → `delivery.to=cron.webhook` ile açık `delivery.mode="webhook"`

    Doctor, `notify: true` işlerini yalnızca davranışı değiştirmeden yapabildiğinde otomatik olarak geçirir. Bir iş, eski notify geri dönüşünü mevcut Webhook olmayan bir teslim modu ile birleştiriyorsa, doctor uyarır ve bu işi manuel incelemeye bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çağırdığında da uyarır. Bu ana makineye yerel betik mevcut OpenClaw tarafından bakımı yapılmaz ve cron systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` dosyasına yanlış `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; güncel sağlık kontrolleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor, her agent oturum dizinini eski yazma kilidi dosyaları için tarar — bir oturum anormal biçimde çıktığında geride kalan dosyalar. Bulunan her kilit dosyası için şunları raporlar: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID, 30 dakikadan eski veya OpenClaw dışı bir sürece ait olduğu kanıtlanabilen canlı PID). `--fix` / `--repair` modunda eski kilit dosyalarını otomatik olarak kaldırır; aksi halde bir not yazdırır ve `--fix` ile yeniden çalıştırmanızı söyler.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor, agent oturum JSONL dosyalarını 2026.4.24 prompt dökümü yeniden yazma hatasının oluşturduğu yinelenmiş dal şekli için tarar: OpenClaw dahili çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı dönüşü ve aynı görünür kullanıcı promptunu içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve dökümü etkin dala yeniden yazar; böylece Gateway geçmişi ve bellek okuyucuları artık yinelenen dönüşleri görmez.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları kontrol eder:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı sorar ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı teklif eder (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu verir).
    - **macOS bulut eşitlemeli durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır; çünkü eşitleme destekli yollar daha yavaş I/O ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır; çünkü SD veya eMMC destekli rastgele I/O, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Oturum dizinleri eksik**: geçmişi kalıcı tutmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Döküm uyuşmazlığı**: son oturum girdilerinde döküm dosyaları eksik olduğunda uyarır.
    - **Ana oturum "1 satırlı JSONL"**: ana dökümde yalnızca bir satır olduğunda işaretler (geçmiş birikmiyordur).
    - **Birden fazla durum dizini**: ev dizinleri arasında birden fazla `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, onu uzak ana makinede çalıştırmanızı hatırlatır (durum oradadır).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve `600` değerine sıkılaştırmayı teklif eder.

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor, auth deposundaki OAuth profillerini inceler, tokenlar süresi dolmak üzereyken/süresi dolduğunda uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili eskiyse bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme girişimlerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu raporlar ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de raporlar:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/auth hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    `hooks.gmail.model` ayarlanmışsa doctor, model referansını kataloğa ve izin listesine göre doğrular ve çözümlenmeyeceğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    Korumalı alan etkinleştirildiğinde doctor Docker imajlarını kontrol eder ve mevcut imaj eksikse derlemeyi veya eski adlara geçmeyi teklif eder.
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor, eski OpenClaw tarafından oluşturulmuş Plugin bağımlılığı hazırlama durumunu `openclaw doctor --fix` / `openclaw doctor --repair` modunda kaldırır. Bu, eski oluşturulmuş bağımlılık köklerini, eski install-stage dizinlerini, daha önceki paketli Plugin bağımlılığı onarım kodundan kalan paket yerel kalıntılarını ve mevcut paketli bildirimi gölgeleyebilen, sahipsiz veya kurtarılmış yönetilen npm paketli `@openclaw/*` Plugin kopyalarını kapsar.

    Doctor, yapılandırma bunlara başvurduğunda ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Pluginleri de yeniden yükleyebilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış agent çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlatma ve yapılandırma yeniden yükleme paket yöneticilerini çalıştırmaz; Plugin yüklemeleri açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizleme ipuçları">
    Doctor eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırmayı ve geçerli gateway bağlantı noktasını kullanarak OpenClaw hizmetini yüklemeyi önerir. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adı verilmiş OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi gateway hizmeti eksikse ancak sistem düzeyi bir OpenClaw gateway hizmeti varsa, doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet yüklemez. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin; ardından yineleneni kaldırın ya da bir sistem supervisor gateway yaşam döngüsünü sahipleniyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabının bekleyen veya uygulanabilir eski durum geçişi olduğunda, doctor (`--fix` / `--repair` modunda) geçiş öncesi bir snapshot oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlangıç devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleme ve kimlik doğrulama sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleme durumunu inceler.

    Raporladıkları:

    - bekleyen ilk eşleme istekleri
    - zaten eşlenmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşlenmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleşirken cihaz kimliğinin artık onaylanan kayıtla eşleşmediği açık anahtar uyuşmazlığı onarımları
    - onaylanmış bir rol için etkin token'ı eksik olan eşlenmiş kayıtlar
    - kapsamları onaylanan eşleme temel çizgisinin dışına sapan eşlenmiş token'lar
    - geçerli makine için gateway tarafındaki token rotasyonundan önceye ait olan veya eski kapsam metadata'sı taşıyan yerel önbelleğe alınmış cihaz token'ı girdileri

    Doctor eşleme isteklerini otomatik onaylamaz veya cihaz token'larını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - yeni bir token'ı `openclaw devices rotate --device <deviceId> --role <role>` ile döndürün
    - eski bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın "zaten eşlendi ama hâlâ eşleme gerekli alınıyor" açığını kapatır: doctor artık ilk eşlemeyi bekleyen rol/kapsam yükseltmelerinden ve eski token/cihaz kimliği sapmasından ayırt eder.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor, bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir policy tehlikeli şekilde yapılandırıldığında uyarılar üretir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bir systemd kullanıcı hizmeti olarak çalışıyorsa, doctor gateway'in oturum kapatıldıktan sonra çalışır kalması için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve eski dizinler)">
    Doctor varsayılan agent için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, gereksinimleri eksik ve izin listesi tarafından engellenmiş Skills sayılarını verir.
    - **Eski çalışma alanı dizinleri**: `~/openclaw` veya diğer eski çalışma alanı dizinleri geçerli çalışma alanının yanında bulunduğunda uyarır.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; tüm hatalar için Plugin kimliklerini listeler; paket Plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: geçerli runtime ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin registry tarafından yayımlanan yükleme zamanı uyarılarını veya hatalarını ortaya çıkarır.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yakın olup olmadığını ya da onu aşıp aşmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kırpma yüzdesini, kırpma nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir oranı olarak toplam enjekte edilmiş karakterleri raporlar. Dosyalar kırpıldığında veya sınıra yaklaştığında, doctor `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını yapmak için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkık kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran heartbeat hedefleri ve `agents.*.models["<channel>/*"]` override'ları. Bu, kanal runtime'ı gitmişken yapılandırmanın hâlâ gateway'den ona bind etmesini istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Shell tamamlama">
    Doctor, geçerli shell için sekme tamamlama yüklü olup olmadığını denetler (zsh, bash, fish veya PowerShell):

    - Shell profili yavaş bir dinamik tamamlama deseni (`source <(openclaw completion ...)`) kullanıyorsa, doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse, doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa, doctor bunu yüklemeyi sorar (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel Gateway token kimlik doğrulama hazırlığını denetler.

    - Token modu bir token gerektiriyorsa ve hiçbir token kaynağı yoksa, doctor bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak kullanılamıyorsa, doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir token SecretRef yapılandırılmadığında oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef farkındalıklı onarımlar">
    Bazı onarım akışlarının, çalışma zamanı fail-fast davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabilir olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token SecretRef üzerinden yapılandırılmışsa ancak geçerli komut yolunda kullanılamıyorsa, doctor kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve çökmek veya tokenı eksik olarak yanlış bildirmek yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve Gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması gömme sağlayıcısının varsayılan ajan için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse, npm paketi ve manuel ikili yolu seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel bir model dosyası veya tanınan uzak/indirilebilir model URL'si olup olmadığını denetler. Eksikse, uzak bir sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarının bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Otomatik sağlayıcı**: önce yerel model kullanılabilirliğini denetler, ardından otomatik seçim sırasındaki her uzak sağlayıcıyı dener.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (Gateway denetim sırasında sağlıklıydı), doctor bu sonucu CLI tarafından görülebilen yapılandırmayla çapraz başvurur ve tutarsızlıkları belirtir. Doctor varsayılan yolda yeni bir gömme pingi başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durum komutunu kullanın.

    Çalışma zamanında gömme hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa, doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Süpervizör yapılandırması denetimi + onarımı">
    Doctor, kurulu süpervizör yapılandırmasında (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar olup olmadığını denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve servis dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, süpervizör yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --repair`, önerilen düzeltmeleri istem göstermeden uygular.
    - `openclaw doctor --repair --force`, özel süpervizör yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway servis yaşam döngüsü için doctor'ı salt okunur tutar. Servis sağlığını bildirmeye ve servis dışı onarımları çalıştırmaya devam eder, ancak dış bir süpervizör bu yaşam döngüsünün sahibi olduğu için servis kurma/başlatma/yeniden başlatma/bootstrap, süpervizör yapılandırması yeniden yazmaları ve eski servis temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd Gateway birimi etkin durumdayken komut/giriş noktası metaverilerini yeniden yazmaz. Ayrıca, yardımcı servis dosyalarının temizlik gürültüsü oluşturmaması için yinelenen servis taraması sırasında etkin olmayan, legacy olmayan ek Gateway benzeri birimleri yok sayar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, doctor servis kurma/onarım işlemi SecretRef'i doğrular ancak çözümlenmiş düz metin token değerlerini süpervizör servis ortamı metaverilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içi gömdüğü yönetilen `.env`/SecretRef destekli servis ortam değerlerini algılar ve bu değerlerin süpervizör tanımı yerine çalışma zamanı kaynağından yüklenmesi için servis metaverilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` değerine sabitlendiğini algılar ve servis metaverilerini geçerli porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, doctor kurma/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, doctor mod açıkça ayarlanana kadar kurma/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için, doctor token sapması denetimleri artık servis kimlik doğrulama metaverilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa eski bir OpenClaw ikilisinden gelen Gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Tam yeniden yazmayı her zaman `openclaw gateway install --force` ile zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor servis çalışma zamanını (PID, son çıkış durumu) inceler ve servis kurulu olduğu halde gerçekten çalışmıyorsa uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri bildirir (Gateway zaten çalışıyor, SSH tüneli).
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, Gateway servisi Bun veya sürüm tarafından yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir çünkü servis kabuk başlatma dosyanızı yüklemez. Doctor, kullanılabilir olduğunda bir sistem Node kurulumuna geçmeyi önerir (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'lar, etkileşimli kabuk PATH'ini kopyalamak yerine kanonik bir sistem PATH'i (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Homebrew tarafından yönetilen sistem ikilileri kullanılabilir kalırken Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri Node alt süreçlerinin hangisini çözümlediğini değiştirmez. Linux servisleri hâlâ açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı-bin dizinlerini korur, ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcut olduğunda servis PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz metaverileri">
    Doctor tüm yapılandırma değişikliklerini kalıcı hale getirir ve doctor çalıştırmasını kaydetmek için sihirbaz metaverilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedekleme (önerilen özel GitHub veya GitLab) hakkında tam kılavuz için bkz. [/concepts/agent-workspace](/tr/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
