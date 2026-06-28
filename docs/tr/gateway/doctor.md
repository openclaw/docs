---
read_when:
    - Doctor migrasyonları ekleme veya değiştirme
    - Geriye dönük uyumsuz config değişiklikleri sunma
sidebarTitle: Doctor
summary: 'Doctor komutu: sağlık kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-06-28T00:34:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım + geçiş aracıdır. Bayat yapılandırma/durumu düzeltir, sağlığı denetler ve uygulanabilir onarım adımları sağlar.

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

    Varsayılanları sormadan kabul et (geçerli olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dahil).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Önerilen onarımları sormadan uygula (güvenli olduğunda onarımlar + yeniden başlatmalar).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI veya ön kontrol otomasyonu için yapılandırılmış sağlık denetimleri çalıştır. Bu mod
    salt okunurdur: sormaz, onarmaz, yapılandırmayı taşımaz, hizmetleri yeniden başlatmaz veya
    duruma dokunmaz.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Agresif onarımları da uygula (özel supervisor yapılandırmalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Komutları sormadan çalıştır ve yalnızca güvenli geçişleri uygula (yapılandırma normalleştirme + disk üzerindeki durum taşıma işlemleri). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox eylemlerini atlar. Eski durum geçişleri algılandığında otomatik çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek gateway kurulumları için sistem hizmetlerini tara (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek istiyorsan önce yapılandırma dosyasını aç:

```bash
cat ~/.openclaw/openclaw.json
```

## Salt okunur lint modu

`openclaw doctor --lint`, `openclaw doctor --fix` komutunun otomasyon dostu
kardeşidir. İkisi de doctor sağlık denetimlerini kullanır, ancak duruşları
farklıdır:

| Mod                      | Sorular   | Yapılandırma/durum yazar | Çıktı                         | Bunun için kullan              |
| ------------------------ | --------- | ------------------------ | ----------------------------- | ------------------------------ |
| `openclaw doctor`        | evet      | hayır                    | kullanıcı dostu sağlık raporu | durumu denetleyen bir insan    |
| `openclaw doctor --fix`  | bazen     | evet, onarım ilkesiyle   | kullanıcı dostu onarım günlüğü | onaylı onarımları uygulama     |
| `openclaw doctor --lint` | hayır     | hayır                    | yapılandırılmış bulgular      | CI, ön kontrol ve inceleme kapıları |

Modernleştirilmiş sağlık denetimleri isteğe bağlı bir `repair()` uygulaması
sağlayabilir. `doctor --fix`, bu onarımlar mevcut olduğunda uygular ve henüz
taşınmamış denetimler için mevcut doctor onarım akışını kullanmaya devam eder.
Yapılandırılmış onarım sözleşmesi, onarım raporlamasını algılamadan da ayırır:
`detect()` mevcut bulguları bildirirken `repair()` değişiklikleri,
yapılandırma/dosya farklarını ve dosya dışı yan etkileri bildirebilir. Bu,
lint denetimlerinin mutasyon planlamasına neden olmadan gelecekteki
`doctor --fix --dry-run` ve fark çıktısı için geçiş yolunu açık tutar.

Örnekler:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON çıktısı şunları içerir:

- `ok`: seçilen önem eşiğini karşılayan görünür bir bulgu olup olmadığı
- `checksRun`: yürütülen sağlık denetimi sayısı
- `checksSkipped`: seçilen profil, `--only` veya `--skip` tarafından atlanan denetimler
- `findings`: `checkId`, `severity`, `message` ve isteğe bağlı `path`, `line`,
  `column`, `ocPath` ve `fixHint` içeren yapılandırılmış tanı bilgileri

Çıkış kodları:

- `0`: seçilen eşikte veya üzerinde bulgu yok
- `1`: bir veya daha fazla bulgu seçilen eşiği karşıladı
- `2`: lint bulguları üretilemeden önce komut/çalışma zamanı hatası

Hem neyin yazdırılacağını hem de neyin sıfır olmayan lint çıkışına neden olacağını
kontrol etmek için `--severity-min info|warning|error` kullan. Varsayılan otomasyon kümesinden hariç tutulan daha derin, isteğe bağlı denetimler dahil olmak üzere eksiksiz lint envanterini çalıştırmak için `--all` kullan. Dar ön kontrol kapıları için `--only <id>` ve
lint çalışmasının geri kalanını etkin tutarken gürültülü bir denetimi geçici olarak hariç tutmak için
`--skip <id>` kullan.
`--json`, `--severity-min`, `--all`, `--only` ve `--skip` gibi lint çıktısı
seçenekleri `--lint` ile eşleştirilmelidir; normal doctor ve onarım çalışmaları
bunları reddeder.

## Ne yapar (özet)

<AccordionGroup>
  <Accordion title="Sağlık, UI ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön uçuş güncellemesi (yalnızca etkileşimli).
    - UI protokol güncelliği denetimi (protokol şeması daha yeniyse Control UI yeniden derlenir).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Skills durum özeti (uygun/eksik/engellenmiş) ve plugin durumu.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değerler için yapılandırma normalleştirme.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` içine Talk yapılandırma geçişi.
    - Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode provider geçersiz kılma uyarıları (`models.providers.opencode` / `models.providers.opencode-go`).
    - Eski OpenAI Codex provider/profil geçişi (`openai-codex` → `openai`) ve bayat `models.providers.openai-codex` için gölgeleme uyarıları.
    - OpenAI Codex OAuth profilleri için OAuth TLS önkoşulları denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya plugin sahipli araçlar istediğinde Plugin/araç allowlist uyarıları.
    - Eski disk üzerindeki durum geçişi (oturumlar/agent dizini/WhatsApp kimlik doğrulaması).
    - Eski plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/payload alanları, payload `provider`, `notify: true` webhook geri dönüş işleri).
    - Eski tüm-agent çalışma zamanı ilkesi temizliği; provider/model çalışma zamanı ilkesi etkin rota seçicidir.
    - Pluginler etkinleştirildiğinde bayat plugin yapılandırması temizliği; `plugins.enabled=false` olduğunda bayat plugin referansları durağan kapsama yapılandırması olarak ele alınır ve korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyası incelemesi ve bayat kilit temizliği.
    - Etkilenen 2026.4.24 derlemeleri tarafından oluşturulan yinelenmiş prompt-yeniden-yazma dalları için oturum transkripti onarımı.
    - Takılmış subagent yeniden başlatma-kurtarma tombstone algılama; `--fix`, bayat iptal edilmiş kurtarma bayraklarını temizlemeyi destekler, böylece başlangıç çocuğu yeniden başlatma-iptal edilmiş olarak görmeye devam etmez.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, transkriptler, durum dizini).
    - Yerel çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süresinin dolmasını denetler, süresi dolmak üzere olan tokenları yenileyebilir ve kimlik doğrulama profili cooldown/devre dışı durumlarını bildirir.

  </Accordion>
  <Accordion title="Gateway, hizmetler ve supervisorlar">
    - Sandbox etkinleştirildiğinde sandbox imajı onarımı.
    - Eski hizmet geçişi ve ek gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ama çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durum uyarıları (çalışan gateway üzerinden yoklanır).
    - Kanala özgü izin denetimleri `openclaw channels capabilities` altında bulunur; örneğin Discord ses kanalı izinleri `openclaw channels capabilities --channel discord --target channel:<channel-id>` ile denetlenir.
    - Yerel TUI istemcileri hâlâ çalışırken bozulmuş Gateway event-loop sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modellerde, geri dönüşlerde, görüntü/video üretim modellerinde, heartbeat/subagent/compaction geçersiz kılmalarında, hooklarda, kanal model geçersiz kılmalarında ve oturum rota sabitlemelerinde eski `openai-codex/*` model refleri için Codex rota onarımı; `--fix` bunları `openai/*` olarak yeniden yazar, `openai-codex:*` kimlik doğrulama profillerini/sırasını `openai:*` içine taşır, bayat oturum/tüm-agent çalışma zamanı sabitlemelerini kaldırır ve kanonik OpenAI agent reflerini varsayılan Codex harness üzerinde bırakır.
    - İsteğe bağlı onarımla supervisor yapılandırma denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında kabuk `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan gateway hizmetleri için gömülü proxy ortam temizliği.
    - Gateway çalışma zamanı en iyi uygulama denetimleri (Node ve Bun, sürüm yöneticisi yolları).
    - Gateway port çakışması tanıları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı yoksa token üretimi önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleme sorun algılama (bekleyen ilk kez eşleme istekleri, bekleyen rol/kapsam yükseltmeleri, bayat yerel cihaz-token önbellek sapması ve eşlenmiş kayıt kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve kabuk">
    - Linux üzerinde systemd linger denetimi.
    - Çalışma alanı bootstrap dosya boyutu denetimi (bağlam dosyaları için kesilme/sınıra yakın uyarıları).
    - Varsayılan agent için Skills hazırlık denetimi; eksik binary, env, yapılandırma veya OS gereksinimleri olan izin verilmiş skills bildirir ve `--fix`, kullanılamayan skills öğelerini `skills.entries` içinde devre dışı bırakabilir.
    - Kabuk tamamlama durum denetimi ve otomatik kurulum/yükseltme.
    - Bellek araması embedding provider hazırlık denetimi (yerel model, uzak API anahtarı veya QMD binary).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyumsuzluğu, eksik UI varlıkları, eksik tsx binary).
    - Güncellenmiş yapılandırma + sihirbaz meta verisi yazar.

  </Accordion>
</AccordionGroup>

## Dreams UI geri doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Geri doldur**, **Sıfırla** ve **Grounded Temizle** eylemlerini içerir. Bu eylemler gateway doctor tarzı RPC yöntemlerini kullanır, ancak `openclaw doctor` CLI onarımı/geçişinin parçası **değildir**.

Ne yaparlar:

- **Geri doldur**, etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir geri doldurma girdilerini `DREAMS.md` içine yazar.
- **Sıfırla**, yalnızca işaretlenmiş geri doldurma günlük girdilerini `DREAMS.md` dosyasından kaldırır.
- **Grounded Temizle**, yalnızca geçmiş yeniden oynatmadan gelen ve henüz canlı hatırlama veya günlük destek biriktirmemiş aşamalanmış yalnızca-grounded kısa vadeli girdileri kaldırır.

Kendi başlarına **yapmadıkları** şeyler:

- `MEMORY.md` dosyasını düzenlemezler
- tam doctor geçişlerini çalıştırmazlar
- aşamalanmış CLI yolunu açıkça önce çalıştırmadığın sürece grounded adayları canlı kısa vadeli promotion deposuna otomatik olarak aşamalamazlar

Grounded geçmiş yeniden oynatmanın normal deep promotion hattını etkilemesini istiyorsan bunun yerine CLI akışını kullan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu, `DREAMS.md` dosyasını inceleme yüzeyi olarak tutarken grounded kalıcı adayları kısa vadeli dreaming deposuna aşamalar.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git checkout ise ve doctor etkileşimli çalışıyorsa, doctor çalışmadan önce güncelleme (fetch/rebase/build) yapmayı önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirme">
    Yapılandırma eski değer şekilleri içeriyorsa (örneğin kanala özgü geçersiz kılma olmadan `messages.ackReaction`), doctor bunları mevcut şemaya normalleştirir.

    Buna eski Talk düz alanları da dahildir. Mevcut herkese açık Talk konuşma yapılandırması `talk.provider` + `talk.providers.<provider>`, gerçek zamanlı ses yapılandırması ise `talk.realtime.*` şeklindedir. Doctor, eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` şekillerini provider haritasına yeniden yazar ve eski üst düzey gerçek zamanlı seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` içine yeniden yazar.

    Doctor ayrıca `plugins.allow` boş değilken ve araç ilkesi joker karakter veya Plugin’e ait araç girdileri kullandığında uyarır. `tools.allow: ["*"]` yalnızca gerçekten yüklenen Plugin’lerden gelen araçlarla eşleşir; özel Plugin izin listesini atlamaz.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma kullanımdan kaldırılmış anahtarlar içerdiğinde, diğer komutlar çalışmayı reddeder ve sizden `openclaw doctor` çalıştırmanızı ister.

    Doctor şunları yapar:

    - Hangi eski anahtarların bulunduğunu açıklar.
    - Uyguladığı geçişi gösterir.
    - `~/.openclaw/openclaw.json` dosyasını güncellenmiş şemayla yeniden yazar.

    Gateway başlangıcı eski yapılandırma biçimlerini reddeder ve sizden `openclaw doctor --fix` çalıştırmanızı ister; başlangıçta `openclaw.json` dosyasını yeniden yazmaz. Cron iş deposu geçişleri de `openclaw doctor --fix` tarafından işlenir.

    Mevcut geçişler:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - emekliye ayrılmış `channels.webchat` ve `gateway.webchat` kaldırılır
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → üst düzey `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - eski `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - eski üst düzey gerçek zamanlı Talk seçicileri (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` ve `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` ve `messages.tts.providers.microsoft`
    - TTS konuşmacı seçimi alanları (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` ve `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` ve `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Adlandırılmış `accounts` içeren ama kalıcı tek hesaplı üst düzey kanal değerleri bulunan kanallarda, bu hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşı (`accounts.default` çoğu kanal için; Matrix mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` kaldırılır; yavaş sağlayıcı/model zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın ve tüm çalıştırmanın daha uzun sürmesi gerektiğinde ajan/çalıştırma zaman aşımını bu değerin üzerinde tutun
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` kaldırılır (eski uzantı röle ayarı)
    - eski `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway başlangıcı, `api` değeri gelecekteki veya bilinmeyen bir enum değerine ayarlanmış sağlayıcıları da kapalı hata vermek yerine atlar)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` kaldırılır; Codex uygulama sunucusu Codex’e özgü çalışma alanı araçlarını her zaman yerel tutar

    Doctor uyarıları, çok hesaplı kanallar için hesap-varsayılanı kılavuzunu da içerir:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa, doctor yedek yönlendirmenin beklenmeyen bir hesap seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa, doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` girdilerini elle eklediyseniz, bu `openclaw/plugin-sdk/llm` içindeki yerleşik OpenCode kataloğunu geçersiz kılar. Bu, modelleri yanlış API’ye zorlayabilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırıp model başına API yönlendirmesini ve maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazır olma durumu">
    Tarayıcı yapılandırmanız hâlâ kaldırılmış Chrome uzantısı yolunu gösteriyorsa, doctor bunu mevcut ana makineye yerel Chrome MCP bağlanma modeline normalleştirir:

    - `browser.profiles.*.driver: "extension"` değeri `"existing-session"` olur
    - `browser.relayBindHost` kaldırılır

    Doctor, `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makineye yerel Chrome MCP yolunu da denetler:

    - varsayılan otomatik bağlanma profilleri için Google Chrome’un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144’ün altındaysa uyarır
    - tarayıcı inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makineye yerel Chrome MCP hâlâ şunları gerektirir:

    - gateway/node ana makinesinde Chromium tabanlı 144+ bir tarayıcı
    - tarayıcının yerel olarak çalışıyor olması
    - o tarayıcıda uzaktan hata ayıklamanın etkinleştirilmiş olması
    - tarayıcıdaki ilk bağlanma onayı istemini onaylama

    Buradaki hazır olma durumu yalnızca yerel bağlanma önkoşullarıyla ilgilidir. Existing-session mevcut Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme kesme ve toplu işlemler gibi gelişmiş rotalar hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.

    Bu denetim Docker, sandbox, uzak tarayıcı veya diğer başsız akışlar için geçerli **değildir**. Bunlar ham CDP kullanmaya devam eder.

  </Accordion>
  <Accordion title="2d. OAuth TLS önkoşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında, doctor yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini kontrol etmek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla başarısız olursa (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika), doctor platforma özgü düzeltme kılavuzu yazdırır. Homebrew Node kullanılan macOS’ta düzeltme genellikle `brew postinstall ca-certificates` komutudur. `--deep` ile, Gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz, bunlar yeni sürümlerin otomatik olarak kullandığı yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, bu eski aktarım ayarlarını Codex OAuth ile birlikte gördüğünde uyarır; böylece eskimiş aktarım geçersiz kılmasını kaldırabilir veya yeniden yazabilir ve yerleşik yönlendirme/yedek davranışını geri alabilirsiniz. Özel proxy’ler ve yalnızca başlık geçersiz kılmaları hâlâ desteklenir ve bu uyarıyı tetiklemez.
  </Accordion>
  <Accordion title="2f. Codex rota onarımı">
    Doctor eski `openai-codex/*` model başvurularını denetler. Yerel Codex harness yönlendirmesi kanonik `openai/*` model başvurularını kullanır; OpenAI ajan turları OpenClaw OpenAI sağlayıcı yolu yerine Codex uygulama sunucusu harness’ı üzerinden gider.

    `--fix` / `--repair` modunda doctor, birincil modeller, yedekler, görüntü/video üretim modelleri, heartbeat/subagent/compaction geçersiz kılmaları, hook’lar, kanal modeli geçersiz kılmaları ve eskimiş kalıcı oturum rota durumu dahil olmak üzere etkilenen varsayılan ajan ve ajan başına başvuruları yeniden yazar:

    - `openai-codex/gpt-*` değeri `openai/gpt-*` olur.
    - Codex niyeti, onarılan ajan modeli başvuruları için sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşınır.
    - Çalışma zamanı seçimi sağlayıcı/model kapsamlı olduğundan, eskimiş tüm-ajan çalışma zamanı yapılandırması ve kalıcı oturum çalışma zamanı sabitlemeleri kaldırılır.
    - Onarılan eski model başvurusu eski kimlik doğrulama yolunu korumak için Codex yönlendirmesine ihtiyaç duymadığı sürece mevcut sağlayıcı/model çalışma zamanı ilkesi korunur.
    - Mevcut model yedek listeleri, eski girdileri yeniden yazılarak korunur; kopyalanan model başına ayarlar eski anahtardan kanonik `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri ve kimlik doğrulama profili sabitlemeleri keşfedilen tüm ajan oturum depolarında onarılır.
    - `/codex ...`, "sohbetten yerel bir Codex konuşmasını denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "harici ACP/acpx adaptörünü kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Oturum rota temizliği">
    Doctor, yapılandırılmış modelleri veya çalışma zamanını Codex gibi Plugin’e ait bir rotadan uzaklaştırdıktan sonra eskimiş otomatik oluşturulmuş rota durumu için keşfedilen ajan oturum depolarını da tarar.

    `openclaw doctor --fix`, sahip rotaları artık yapılandırılmadığında `modelOverrideSource: "auto"` model sabitlemeleri, çalışma zamanı modeli meta verileri, sabitlenmiş harness kimlikleri, CLI oturum bağlamaları ve otomatik kimlik doğrulama profili geçersiz kılmaları gibi otomatik oluşturulmuş eskimiş durumu temizleyebilir. Açık kullanıcı veya eski oturum modeli seçimleri elle inceleme için raporlanır ve dokunulmadan bırakılır; o rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor eski disk üstü düzenleri mevcut yapıya geçirebilir:

    - Oturum deposu + transkriptler:
      - `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Ajan dizini:
      - `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys):
      - eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler en iyi çaba temelinde çalışır ve idempotenttir; doctor, herhangi bir eski klasörü yedek olarak geride bıraktığında uyarılar yayar. Gateway/CLI de başlangıçta eski oturumları ve ajan dizinini otomatik olarak geçirir, böylece geçmiş/kimlik doğrulama/modeller elle doctor çalıştırılmadan ajan başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` üzerinden geçirilir. Talk sağlayıcı/sağlayıcı haritası normalleştirmesi artık yapısal eşitlikle karşılaştırır, bu nedenle yalnızca anahtar sırası farkları artık tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski plugin manifest geçişleri">
    Doctor, yüklü tüm Plugin manifestlerini kullanımdan kaldırılmış üst düzey capability anahtarları (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) için tarar. Bulduğunda, bunları `contracts` nesnesine taşımayı ve manifest dosyasını yerinde yeniden yazmayı önerir. Bu geçiş idempotenttir; `contracts` anahtarı zaten aynı değerlere sahipse, eski anahtar veri yinelenmeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca, zamanlayıcının uyumluluk için hâlâ kabul ettiği eski iş şekilleri için cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) denetler.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey payload alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey delivery alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery diğer adları → açık `delivery.channel`
    - eski `notify: true` webhook fallback işleri → `cron.webhook` ayarlandığında açık webhook delivery; duyuru işleri sohbet delivery'lerini korur ve `delivery.completionDestination` alır. `cron.webhook` ayarlanmamışsa, inert üst düzey `notify` işaretçisi hedefi olmayan işler için kaldırılır (duyuru dahil mevcut delivery korunur), çünkü çalışma zamanı delivery bunu hiçbir zaman okumaz

    Gateway, yükleme sırasında hatalı biçimlendirilmiş cron satırlarını da temizler, böylece geçerli işler çalışmaya devam eder. Ham hatalı satırlar, `jobs.json` içinden kaldırılmadan önce etkin deponun yanındaki `jobs-quarantine.json` dosyasına kopyalanır; doctor karantinaya alınmış satırları bildirir, böylece bunları elle inceleyebilir veya onarabilirsiniz.

    Gateway başlatması çalışma zamanı projeksiyonunu normalleştirir ve üst düzey `notify` işaretçisini yok sayar, ancak kalıcı cron yapılandırmasını doctor onarımı için bırakır. `cron.webhook` ayarlanmamışsa, doctor geçiş hedefi olmayan işler için (`delivery.mode` yok/yok sayılmış, kullanılamaz bir webhook hedefi veya mevcut duyuru/sohbet delivery) inert işaretçiyi kaldırır ve mevcut delivery'ye dokunmaz; böylece tekrarlanan `doctor --fix` çalıştırmaları aynı iş hakkında artık yeniden uyarı vermez. `cron.webhook` ayarlanmış ancak geçerli bir HTTP(S) URL'si değilse, doctor yine uyarır ve URL'yi düzeltebilmeniz için işaretçiyi yerinde bırakır.

    Linux'ta doctor, kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` çağırıyorsa da uyarır. Bu ana makineye yerel betik, mevcut OpenClaw tarafından bakımı yapılmaz ve cron systemd kullanıcı veriyoluna ulaşamadığında `~/.openclaw/logs/whatsapp-health.log` içine hatalı `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; geçerli sağlık denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, anormal şekilde sonlanan bir oturumdan geride kalan eski yazma kilidi dosyaları için her ajan oturumu dizinini tarar. Bulunan her kilit dosyası için şunları bildirir: yol, PID, PID'nin hâlâ canlı olup olmadığı, kilit yaşı ve eski kabul edilip edilmediği (ölü PID, hatalı biçimlendirilmiş sahip meta verisi, 30 dakikadan eski olması veya OpenClaw dışı bir sürece ait olduğu kanıtlanabilen canlı PID). `--fix` / `--repair` modunda, ölü, sahipsiz, yeniden kullanılmış, hatalı biçimlendirilmiş-eski veya OpenClaw dışı sahipleri olan kilitleri otomatik olarak kaldırır. Hâlâ canlı bir OpenClaw sürecine ait olan eski kilitler bildirilir ancak yerinde bırakılır; böylece doctor etkin bir transkript yazıcısını kesmez.
  </Accordion>
  <Accordion title="3d. Oturum transkript dalı onarımı">
    Doctor, 2026.4.24 prompt transkript yeniden yazma hatasının oluşturduğu yinelenmiş dal şeklini bulmak için ajan oturumu JSONL dosyalarını tarar: OpenClaw iç çalışma zamanı bağlamına sahip terk edilmiş bir kullanıcı turu ve aynı görünür kullanıcı promptunu içeren etkin bir kardeş. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgünün yanına yedekler ve transkripti etkin dala yeniden yazar; böylece gateway geçmişi ve bellek okuyucuları artık yinelenen turları görmez.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini operasyonel beyin sapıdır. Kaybolursa oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz (başka yerde yedekleriniz yoksa).

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı hakkında uyarır, dizini yeniden oluşturmayı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri onarmayı önerir (ve sahip/grup uyumsuzluğu algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır, çünkü eşitleme destekli yollar daha yavaş G/Ç ve kilit/eşitleme yarışlarına neden olabilir.
    - **Linux SD veya eMMC durum dizini**: durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır, çünkü SD veya eMMC destekli rastgele G/Ç, oturum ve kimlik bilgisi yazmaları altında daha yavaş olabilir ve daha hızlı yıpranabilir.
    - **Linux geçici durum dizini**: durum `tmpfs` veya `ramfs` olarak çözümlendiğinde uyarır, çünkü oturumlar, kimlik bilgileri, yapılandırma ve WAL/günlük yan dosyalarıyla birlikte SQLite durumu yeniden başlatmada kaybolur. Docker `overlay` bağlamaları bilerek işaretlenmez, çünkü yazılabilir katmanları konteyner kaldığı sürece ana makine yeniden başlatmaları boyunca kalıcıdır.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ve oturum deposu dizini gereklidir.
    - **Transkript uyumsuzluğu**: son oturum girdilerinde eksik transkript dosyaları olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkriptte yalnızca bir satır olduğunda işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ev dizinleri genelinde birden çok `~/.openclaw` klasörü olduğunda veya `OPENCLAW_STATE_DIR` başka bir yeri gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor bunu uzak ana makinede çalıştırmanızı hatırlatır (durum orada yaşar).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabilir durumdaysa uyarır ve `600` değerine sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama sağlığı (OAuth sona ermesi)">
    Doctor, auth deposundaki OAuth profillerini inceler, tokenlar sona ermek üzereyse/sona ermişse uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/token profili bayatsa, bir Anthropic API anahtarı veya Anthropic setup-token yolunu önerir. Yenileme istemleri yalnızca etkileşimli çalışırken (TTY) görünür; `--non-interactive` yenileme denemelerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya sağlayıcının yeniden oturum açmanızı söylemesi), doctor yeniden kimlik doğrulamanın gerekli olduğunu bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca şu nedenlerle geçici olarak kullanılamayan auth profillerini de bildirir:

    - kısa bekleme süreleri (hız sınırları/zaman aşımları/auth hataları)
    - daha uzun devre dışı bırakmalar (faturalama/kredi hataları)

    Tokenları macOS Keychain içinde yaşayan eski Codex OAuth profilleri (dosya tabanlı yan dosya düzeninden önceki eski onboarding) yalnızca doctor tarafından onarılır. Keychain destekli eski tokenları yerinde `auth-profiles.json` içine geçirmek için etkileşimli bir terminalden bir kez `openclaw doctor --fix` çalıştırın; bundan sonra gömülü turlar (Telegram, cron, alt ajan dispatch) bunları kanonik OpenAI OAuth profilleri olarak çözer.

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa, doctor model referansını katalog ve izin listesine göre doğrular ve çözümlenmeyecekse veya izin verilmiyorsa uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imaj onarımı">
    Sandbox etkinleştirildiğinde, doctor Docker imajlarını denetler ve geçerli imaj eksikse eski adlara geçmeyi veya derlemeyi önerir.
  </Accordion>
  <Accordion title="7b. Plugin kurulum temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda OpenClaw tarafından oluşturulmuş eski Plugin bağımlılığı hazırlama durumunu kaldırır. Bu; bayat oluşturulmuş bağımlılık köklerini, eski install-stage dizinlerini, önceki gömülü Plugin bağımlılığı onarım kodundan kalan paket yerel kalıntıları ve geçerli gömülü manifesti gölgeleyebilen gömülü `@openclaw/*` Plugin'lerinin sahipsiz veya kurtarılmış yönetilen npm kopyalarını kapsar. Doctor ayrıca ana makine `openclaw` paketini `peerDependencies.openclaw` bildiren yönetilen npm Plugin'lerine yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket yerel çalışma zamanı importları güncellemelerden veya npm onarımlarından sonra çözümlenmeye devam eder.

    Doctor, yapılandırma bunlara başvurduğunda ancak yerel Plugin kayıt defteri bunları bulamadığında eksik indirilebilir Plugin'leri de yeniden kurabilir. Örnekler arasında somut `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları ve yapılandırılmış ajan çalışma zamanları bulunur. Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken paket yöneticisi Plugin onarımını çalıştırmaktan kaçınır; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Gateway başlatması ve yapılandırma yeniden yüklemesi paket yöneticilerini çalıştırmaz; Plugin kurulumları açık doctor/install/update işi olarak kalır.

  </Accordion>
  <Accordion title="8. Gateway hizmet geçişleri ve temizlik ipuçları">
    Doctor, eski gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli gateway portunu kullanarak OpenClaw hizmetini kurmayı önerir. Ayrıca ek gateway benzeri hizmetleri tarayabilir ve temizlik ipuçları yazdırabilir. Profil adlı OpenClaw gateway hizmetleri birinci sınıf kabul edilir ve "ekstra" olarak işaretlenmez.

    Linux'ta, kullanıcı düzeyi gateway hizmeti eksik ancak sistem düzeyi bir OpenClaw gateway hizmeti varsa, doctor otomatik olarak ikinci bir kullanıcı düzeyi hizmet kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin; ardından yineleneni kaldırın veya gateway yaşam döngüsüne bir sistem süpervizörü sahipse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlatma Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda, doctor (`--fix` / `--repair` modunda) geçiş öncesi bir snapshot oluşturur ve ardından en iyi çaba geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifreli durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlatma devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve auth sapması">
    Doctor artık normal sağlık geçişinin parçası olarak cihaz eşleştirme durumunu inceler.

    Bildirdikleri:

    - bekleyen ilk eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol yükseltmeleri
    - zaten eşleştirilmiş cihazlar için bekleyen kapsam yükseltmeleri
    - cihaz id'sinin hâlâ eşleştiği ancak cihaz kimliğinin artık onaylı kayıtla eşleşmediği public-key uyumsuzluğu onarımları
    - onaylı bir rol için etkin tokenı eksik olan eşleştirilmiş kayıtlar
    - kapsamları onaylı eşleştirme temel çizgisinin dışına kayan eşleştirilmiş tokenlar
    - geçerli makine için gateway tarafı token rotasyonundan daha eski olan veya bayat kapsam meta verisi taşıyan yerel önbelleğe alınmış cihaz-token girdileri

    Doctor eşleştirme isteklerini otomatik onaylamaz veya cihaz tokenlarını otomatik döndürmez. Bunun yerine tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir token döndürün
    - bayat bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, yaygın “zaten eşleştirilmiş ama hâlâ eşleştirme gerekli uyarısı alınıyor” açığını kapatır: doctor artık ilk kez eşleştirme ile bekleyen rol/kapsam yükseltmelerini ve eskimiş token/cihaz kimliği sapmasını ayırt eder.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Bir sağlayıcı izin listesi olmadan DM'lere açık olduğunda veya bir ilke tehlikeli şekilde yapılandırıldığında Doctor uyarılar üretir.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bir systemd kullanıcı servisi olarak çalışıyorsa Doctor, çıkıştan sonra Gateway'in çalışmaya devam etmesi için lingering'in etkin olduğundan emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, Plugin'ler ve TaskFlow'lar)">
    Doctor, varsayılan ajan için çalışma alanı durumunun bir özetini yazdırır:

    - **Skills durumu**: uygun, eksik-gereksinimli ve izin-listesi-engelli Skills sayılarını gösterir.
    - **Plugin durumu**: etkin/devre dışı/hatalı Plugin'leri sayar; hatalar için Plugin ID'lerini listeler; paket Plugin yeteneklerini raporlar.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanı ile uyumluluk sorunları olan Plugin'leri işaretler.
    - **Plugin tanılamaları**: Plugin kayıt defterinin yükleme sırasında yaydığı uyarı veya hataları görünür kılar.
    - **TaskFlow kurtarma**: elle incelenmesi veya iptal edilmesi gereken şüpheli yönetilen TaskFlow'ları görünür kılar.

  </Accordion>
  <Accordion title="11b. Bootstrap dosya boyutu">
    Doctor, çalışma alanı bootstrap dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya diğer enjekte edilen bağlam dosyaları) yapılandırılmış karakter bütçesine yaklaşıp yaklaşmadığını veya bunu aşıp aşmadığını denetler. Dosya başına ham ve enjekte edilmiş karakter sayılarını, kırpma yüzdesini, kırpma nedenini (`max/file` veya `max/total`) ve toplam enjekte edilmiş karakterlerin toplam bütçeye oranını raporlar. Dosyalar kırpıldığında veya sınıra yaklaştığında Doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemek için ipuçları yazdırır.
  </Accordion>
  <Accordion title="11d. Eski kanal Plugin temizliği">
    `openclaw doctor --fix` eksik bir kanal Plugin'ini kaldırdığında, o Plugin'e başvuran sarkık kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı yok olmuşken yapılandırmanın hâlâ Gateway'den ona bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı (`source <(openclaw completion ...)`) kullanıyorsa Doctor bunu daha hızlı önbelleğe alınmış dosya varyantına yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse Doctor önbelleği otomatik olarak yeniden oluşturur.
    - Hiç tamamlama yapılandırılmamışsa Doctor bunun kurulmasını ister (yalnızca etkileşimli mod; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` çalıştırın.

  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel token)">
    Doctor, yerel Gateway token kimlik doğrulama hazırlığını denetler.

    - Token modu bir token gerektiriyorsa ve token kaynağı yoksa Doctor bir tane üretmeyi teklif eder.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa Doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir token SecretRef yapılandırılmamışsa üretimi zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur SecretRef duyarlı onarımlar">
    Bazı onarım akışlarının, çalışma zamanının hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix` artık hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, mevcut olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot token'ı SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa Doctor, kimlik bilgisinin yapılandırılmış-ama-kullanılamaz olduğunu bildirir ve token'ı eksik olarak yanlış raporlamak veya çökmek yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve Gateway sağlıksız görünüyorsa yeniden başlatmayı teklif eder.
  </Accordion>
  <Accordion title="13b. Bellek arama hazırlığı">
    Doctor, yapılandırılmış bellek arama embedding sağlayıcısının varsayılan ajan için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikilisinin mevcut ve başlatılabilir olup olmadığını yoklar. Değilse npm paketi ve elle ikili yol seçeneği dahil düzeltme rehberliği yazdırır.
    - **Açık yerel sağlayıcı**: yerel model dosyası veya tanınan uzak/indirilebilir model URL'si olup olmadığını denetler. Eksikse uzak sağlayıcıya geçmeyi önerir.
    - **Açık uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Eski otomatik sağlayıcı**: `memorySearch.provider: "auto"` değerini OpenAI olarak ele alır, OpenAI hazırlığını denetler ve `doctor --fix` bunu `provider: "openai"` olarak yeniden yazar.

    Önbelleğe alınmış bir Gateway yoklama sonucu mevcut olduğunda (denetim sırasında Gateway sağlıklıydı), Doctor bunun sonucunu CLI tarafından görülebilen yapılandırmayla çapraz başvurur ve olası tutarsızlıkları belirtir. Doctor varsayılan yolda yeni bir embedding ping'i başlatmaz; canlı sağlayıcı denetimi istediğinizde derin bellek durum komutunu kullanın.

    Çalışma zamanında embedding hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa Doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları raporlar.
  </Accordion>
  <Accordion title="15. Supervisor yapılandırma denetimi + onarım">
    Doctor, kurulu supervisor yapılandırmasını (launchd/systemd/schtasks) eksik veya güncel olmayan varsayılanlar açısından denetler (ör. systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi). Bir uyumsuzluk bulduğunda güncelleme önerir ve servis dosyasını/görevi geçerli varsayılanlara yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, supervisor yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --fix`, önerilen düzeltmeleri istem olmadan uygular (`--repair` bir takma addır).
    - `openclaw doctor --fix --force`, özel supervisor yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, Gateway servis yaşam döngüsü için Doctor'ı salt okunur tutar. Servis sağlığını yine raporlar ve servis dışı onarımları çalıştırır, ancak dış bir supervisor bu yaşam döngüsüne sahip olduğu için servis kurma/başlatma/yeniden başlatma/bootstrap, supervisor yapılandırma yeniden yazmaları ve eski servis temizliğini atlar.
    - Linux'ta Doctor, eşleşen systemd Gateway birimi etkinken komut/entrypoint meta verilerini yeniden yazmaz. Ayrıca yinelenen servis taraması sırasında etkin olmayan eski olmayan ek Gateway benzeri birimleri yok sayar; böylece yardımcı servis dosyaları temizlik gürültüsü oluşturmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa Doctor servis kurulumu/onarımı SecretRef'i doğrular, ancak çözümlenmiş düz metin token değerlerini supervisor servis ortam meta verilerine kalıcı olarak yazmaz.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içi gömdüğü yönetilen `.env`/SecretRef destekli servis ortam değerlerini algılar ve bu değerlerin supervisor tanımı yerine çalışma zamanı kaynağından yüklenmesi için servis meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra servis komutunun hâlâ eski bir `--port` sabitlediğini algılar ve servis meta verilerini geçerli porta yeniden yazar.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa Doctor kurulum/onarım yolunu uygulanabilir rehberlikle engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa Doctor, mod açıkça ayarlanana kadar kurulumu/onarımı engeller.
    - Linux kullanıcı-systemd birimleri için Doctor token sapması denetimleri artık servis kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Doctor servis onarımları, yapılandırma en son daha yeni bir sürüm tarafından yazıldıysa eski bir OpenClaw ikilisinden gelen Gateway servisini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Her zaman `openclaw gateway install --force` ile tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + port tanılamaları">
    Doctor servis çalışma zamanını (PID, son çıkış durumu) inceler ve servis kurulu olduğu hâlde gerçekten çalışmadığında uyarır. Ayrıca Gateway portunda (varsayılan `18789`) port çakışmalarını denetler ve olası nedenleri (Gateway zaten çalışıyor, SSH tüneli) raporlar.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Gateway servisi Bun üzerinde veya sürüm tarafından yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında Doctor uyarır. WhatsApp + Telegram kanalları Node gerektirir ve sürüm yöneticisi yolları yükseltmelerden sonra bozulabilir, çünkü servis kabuk başlatmanızı yüklemez. Doctor, mevcut olduğunda sistem Node kurulumuna geçmeyi teklif eder (Homebrew/apt/choco).

    Yeni kurulan veya onarılan macOS LaunchAgent'ları etkileşimli kabuk PATH'ini kopyalamak yerine kurallı bir sistem PATH'i (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Homebrew tarafından yönetilen sistem ikilileri kullanılabilir kalırken Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri Node alt süreçlerinin neyi çözümlediğini değiştirmez. Linux servisleri açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı user-bin dizinlerini korumaya devam eder, ancak tahmin edilen sürüm yöneticisi fallback dizinleri yalnızca bu dizinler diskte mevcutsa servis PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazma + sihirbaz meta verileri">
    Doctor tüm yapılandırma değişikliklerini kalıcılaştırır ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı zaten git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi için tam kılavuz olarak [/concepts/agent-workspace](/tr/concepts/agent-workspace) sayfasına bakın (önerilen: özel GitHub veya GitLab).

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway çalıştırma kılavuzu](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
