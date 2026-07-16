---
read_when:
    - Doctor geçişlerini ekleme veya değiştirme
    - Yapılandırmada geriye dönük uyumluluğu bozan değişikliklerin kullanıma sunulması
sidebarTitle: Doctor
summary: 'Doctor komutu: sistem durumu kontrolleri, yapılandırma geçişleri ve onarım adımları'
title: Doktor
x-i18n:
    generated_at: "2026-07-16T17:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`, OpenClaw için onarım ve geçiş aracıdır. Eski yapılandırmayı/durumu düzeltir, sistem sağlığını denetler ve uygulanabilir onarım adımları sunar.

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

    İstemde bulunmadan varsayılanları kabul eder (uygun olduğunda yeniden başlatma/hizmet/sandbox onarım adımları dâhil).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Önerilen onarımları istemde bulunmadan uygular (`--repair` bir diğer addır).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI veya ön kontrol otomasyonu için yapılandırılmış sağlık denetimleri çalıştırır. Salt okunur: istem,
    onarım, geçiş, yeniden başlatma veya durum yazma işlemi yapmaz.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Agresif onarımları da uygular (özel gözetmen yapılandırmalarının üzerine yazar).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    İstem olmadan çalışır ve yalnızca güvenli geçişleri uygular (yapılandırma normalleştirmesi +
    diskteki durumun taşınması). İnsan onayı gerektiren yeniden başlatma/hizmet/sandbox
    eylemlerini atlar. Eski durum geçişleri algılandığında yine otomatik olarak çalışır.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Ek Gateway kurulumları için sistem hizmetlerini tarar (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Yazmadan önce değişiklikleri incelemek için ilk olarak yapılandırma dosyasını açın:

```bash
cat ~/.openclaw/openclaw.json
```

## Salt okunur lint modu

`openclaw doctor --lint`,
`openclaw doctor --fix` aracının otomasyona uygun eşdeğeridir. Aynı Doctor kural kayıt defterini paylaşırlar ancak
kuralları aynı şekilde seçmez veya uygulamazlar:

| Mod                      | İstemler   | Yapılandırma/durum yazma | Çıktı                  | Kullanım amacı                         |
| ------------------------ | ---------- | ------------------------ | ---------------------- | -------------------------------------- |
| `openclaw doctor`        | evet       | hayır                    | anlaşılır sağlık raporu | bir kişinin durumu denetlemesi          |
| `openclaw doctor --fix`  | bazen      | evet, onarım ilkesiyle   | anlaşılır onarım günlüğü | onaylanan onarımları uygulama           |
| `openclaw doctor --lint` | hayır      | hayır                    | yapılandırılmış bulgular | CI, ön kontrol ve inceleme eşikleri     |

Varsayılan `doctor --lint`, geniş kapsamlı güvenli otomasyon profilini çalıştırır: statik, yerel ve
CI ya da ön kontrol çıktısında yararlı olan denetimler. Tavsiye niteliğindeki, ortama duyarlı,
canlı hizmete bağımlı, hesap/çalışma alanı envanteriyle veya geçmiş temizliğiyle ilgili, isteğe bağlı denetimleri
atlar. Bu isteğe bağlı denetimler dâhil kayıtlı lint denetiminin tamamını istediğinizde
`doctor --lint --all`, hedefli bir denetim içinse `--only <id>` kullanın.

`doctor --fix`, lint varsayılan profilini kullanmaz ve
`--all` kabul etmez. Doctor'ın sıralı onarım yolunu çalıştırır: modern sağlık denetimleri isteğe bağlı bir
`repair()` uygulaması sağlayabilirken eski alanlar hâlâ eski Doctor onarım akışlarını kullanır.
Bazı lint bulguları kasıtlı olarak yalnızca tanılama amaçlıdır; dolayısıyla bir denetimin
`--lint --all` içinde görünmesi, `--fix` aracının o alanı değiştireceği anlamına gelmez.
Sözleşme, `detect()` (bulguları bildirir) ile `repair()` (değişiklikleri/farkları/yan etkileri
bildirir) işlevlerini birbirinden ayırır; bu da lint denetimlerini değişiklik planlayıcılarına dönüştürmeden
gelecekteki bir `doctor --fix --dry-run` için yol açık tutar.

Bazı yerleşik denetimler, `--all`, `--only` ve Doctor onarım akışlarında kullanılabilir kalırken
varsayılan `doctor --lint` otomasyon profilinin parçası olmamaları için dâhilî olarak varsayılan biçimde devre dışıdır.
Bulgu önem derecesi yine her bulgu için yayınlanır (`info`, `warning` veya `error`);
varsayılan seçim bir önem derecesi seviyesi değildir.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON çıktı alanları:

- `ok`: herhangi bir bulgunun seçilen önem derecesi eşiğini karşılayıp karşılamadığı
- `checksRun` / `checksSkipped`: sayılar (profil, `--only` veya `--skip` nedeniyle atlananlar)
- `findings`: `checkId`, `severity`, `message` ve isteğe bağlı `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint` içeren yapılandırılmış tanılamalar

Çıkış kodları:

| Kod | Anlam                                                       |
| --- | ----------------------------------------------------------- |
| `0`  | seçilen eşikte veya üzerinde bulgu yok                      |
| `1`  | bir veya daha fazla bulgu seçilen eşiği karşıladı           |
| `2`  | bulgular yayınlanamadan önce komut/çalışma zamanı hatası oluştu |

Bayraklar:

- `--severity-min info|warning|error` (varsayılan `warning`): hem neyin yazdırılacağını hem de neyin sıfır olmayan bir çıkışa yol açacağını denetler.
- `--all`: varsayılan otomasyon kümesinin dışında bırakılan isteğe bağlı denetimler dâhil, kayıtlı tüm lint denetimlerini çalıştırır.
- `--only <id>` (tekrarlanabilir): yalnızca belirtilen denetim kimliklerini çalıştırır; bilinmeyen bir kimlik hata bulgusu olarak bildirilir.
- `--skip <id>` (tekrarlanabilir): çalışmanın geri kalanını etkin tutarken bir denetimi hariç tutar.
- `--json`, `--severity-min`, `--all`, `--only` ve `--skip`, `--lint` gerektirir; düz `openclaw doctor` ve `--fix` çalıştırmaları bunları reddeder.

## Yaptıkları (özet)

<AccordionGroup>
  <Accordion title="Sağlık, kullanıcı arayüzü ve güncellemeler">
    - Git kurulumları için isteğe bağlı ön kontrol güncellemesi (yalnızca etkileşimli).
    - Kullanıcı arayüzü protokolü güncellik denetimi (protokol şeması daha yeniyse Control UI'ı yeniden oluşturur).
    - Sağlık denetimi + yeniden başlatma istemi.
    - Yalnızca sorunlara ilişkin Skills ve Plugin notları; sağlıklı envanter `openclaw skills check` ve `openclaw plugins list` içinde kalır.

  </Accordion>
  <Accordion title="Yapılandırma ve geçişler">
    - Eski değer biçimleri için yapılandırma normalleştirmesi.
    - Eski düz `talk.*` alanlarından `talk.provider` + `talk.providers.<provider>` yapısına Talk yapılandırması geçişi.
    - Eski Chrome uzantısı yapılandırmaları ve Chrome MCP hazırlığı için tarayıcı geçiş denetimleri.
    - OpenCode sağlayıcısı geçersiz kılma uyarıları (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Eski OpenAI Codex sağlayıcı/profil geçişi (`openai-codex` → `openai`) ve eski `models.providers.openai-codex` için gölgeleme uyarıları.
    - OpenAI Codex OAuth profilleri için OAuth TLS ön koşulu denetimi.
    - `plugins.allow` kısıtlayıcıyken araç ilkesi hâlâ joker karakter veya Plugin'e ait araçlar istediğinde Plugin/araç izin listesi uyarıları.
    - Diskteki eski durumun geçişi (oturumlar/ajan dizini/WhatsApp kimlik doğrulaması).
    - Eski Plugin manifest sözleşme anahtarı geçişi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Eski cron deposu geçişi (`jobId`, `schedule.cron`, üst düzey teslim/yük alanları, yük `provider`, `notify: true` Webhook geri dönüş işleri).
    - `agents.defaults`, `agents.list[]` ve `models.providers.*` genelinde (model başına girdiler dâhil) Codex CLI çalışma zamanı sabitleme onarımı (`agentRuntime.id: "codex-cli"` → `"codex"`).
    - Plugin'ler etkinleştirildiğinde eski Plugin yapılandırmasının temizlenmesi; `plugins.enabled=false` olduğunda eski Plugin başvuruları etkisiz sınırlama yapılandırması olarak korunur.

  </Accordion>
  <Accordion title="Durum ve bütünlük">
    - Oturum kilit dosyasının incelenmesi ve eski kilitlerin temizlenmesi.
    - Etkilenen 2026.4.24 derlemelerinin oluşturduğu yinelenen istem yeniden yazma dalları için oturum dökümü onarımı.
    - Sıkışmış alt ajan yeniden başlatma-kurtarma mezar taşı algılaması; başlangıcın alt öğeyi sürekli yeniden başlatma nedeniyle iptal edilmiş olarak değerlendirmemesi için eski, iptal edilmiş kurtarma bayraklarını temizlemeye yönelik `--fix` desteği.
    - Durum bütünlüğü ve izin denetimleri (oturumlar, dökümler, durum dizini).
    - Yerel olarak çalışırken yapılandırma dosyası izin denetimleri (chmod 600).
    - Model kimlik doğrulama sağlığı: OAuth süre sonunu denetler, süresi dolmak üzere olan token'ları yenileyebilir ve kimlik doğrulama profili bekleme/devre dışı durumlarını bildirir.

  </Accordion>
  <Accordion title="Gateway, hizmetler ve gözetmenler">
    - Sandbox etkinleştirildiğinde sandbox görüntüsü onarımı.
    - Eski hizmet geçişi ve ek Gateway algılama.
    - Matrix kanalı eski durum geçişi (`--fix` / `--repair` modunda).
    - Gateway çalışma zamanı denetimleri (hizmet kurulu ancak çalışmıyor; önbelleğe alınmış launchd etiketi).
    - Kanal durumu uyarıları (çalışan Gateway üzerinden yoklanır).
    - Kanala özel izin denetimleri `openclaw channels capabilities` altında bulunur; örneğin Discord ses kanalı izinleri `openclaw channels capabilities --channel discord --target channel:<channel-id>` ile denetlenir.
    - Yerel TUI istemcileri çalışmaya devam ederken bozulan Gateway olay döngüsü sağlığı için WhatsApp yanıt verebilirlik denetimleri; `--fix` yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
    - Birincil modeller, geri dönüşler, görüntü/video oluşturma modelleri, Heartbeat/alt ajan/Compaction geçersiz kılmaları, kancalar, kanal modeli geçersiz kılmaları ve oturum rota sabitlemelerindeki eski `openai-codex/*` model başvuruları için Codex rota onarımı; `--fix` bunları `openai/*` olarak yeniden yazar, `openai-codex:*` kimlik doğrulama profillerini/sırasını `openai:*` yapısına geçirir, eski oturum/tüm ajan çalışma zamanı sabitlemelerini kaldırır ve onarılmış etkin rotanın Codex'in uyumlu olup olmadığını belirlemesini sağlar.
    - İsteğe bağlı onarımla gözetmen yapılandırması denetimi (launchd/systemd/schtasks).
    - Kurulum veya güncelleme sırasında kabuk `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` değerlerini yakalayan Gateway hizmetleri için gömülü proxy ortamı temizliği.
    - Gateway çalışma zamanı denetimleri (desteklenmeyen eski Bun hizmetleri, sürüm yöneticisi yolları).
    - Gateway bağlantı noktası çakışması tanılamaları (varsayılan `18789`).

  </Accordion>
  <Accordion title="Kimlik doğrulama, güvenlik ve eşleştirme">
    - Açık DM ilkeleri için güvenlik uyarıları.
    - Yerel token modu için Gateway kimlik doğrulama denetimleri (token kaynağı olmadığında token oluşturmayı önerir; token SecretRef yapılandırmalarının üzerine yazmaz).
    - Cihaz eşleştirme sorunu algılama (bekleyen ilk eşleştirme istekleri, bekleyen rol/kapsam yükseltmeleri, eski yerel cihaz token'ı önbellek sapması ve eşleştirilmiş kayıt kimlik doğrulama sapması).

  </Accordion>
  <Accordion title="Çalışma alanı ve kabuk">
    - Linux'ta systemd linger denetimi.
    - Çalışma alanı önyükleme dosyası boyutu denetimi (bağlam dosyaları için kesilme/sınıra yaklaşma uyarıları).
    - Varsayılan ajan için Skills hazırlık denetimi; eksik ikili dosya, ortam, yapılandırma veya işletim sistemi gereksinimi olan izin verilmiş Skills'i bildirir ve `--fix`, `skills.entries` içinde kullanılamayan Skills'i devre dışı bırakabilir.
    - Kabuk tamamlama durumu denetimi ve otomatik kurulum/yükseltme.
    - Bellek araması gömme sağlayıcısı hazırlık denetimi (yerel model, uzak API anahtarı veya QMD ikili dosyası).
    - Kaynak kurulum denetimleri (pnpm çalışma alanı uyuşmazlığı, eksik kullanıcı arayüzü varlıkları, eksik tsx ikili dosyası).
    - Güncellenmiş yapılandırmayı + sihirbaz meta verilerini yazar.

  </Accordion>
</AccordionGroup>

## Dreams kullanıcı arayüzü geriye dönük doldurma ve sıfırlama

Control UI Dreams sahnesi, grounded dreaming iş akışı için **Backfill**, **Reset** ve **Clear Grounded** eylemlerini içerir. Bunlar Gateway doctor tarzı RPC yöntemlerini kullanır ancak `openclaw doctor` CLI onarımının/geçişinin parçası **değildir**.

| Eylem          | Yaptığı işlem                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | Etkin çalışma alanındaki geçmiş `memory/YYYY-MM-DD.md` dosyalarını tarar, grounded REM günlük geçişini çalıştırır ve geri alınabilir backfill girdilerini `DREAMS.md` içine yazar. |
| Reset          | Yalnızca işaretlenmiş backfill günlük girdilerini `DREAMS.md` içinden kaldırır.                                                                                                  |
| Clear Grounded | Yalnızca geçmiş yeniden oynatmadan hazırlanmış, henüz canlı hatırlama veya günlük destek biriktirmemiş grounded'a özgü kısa süreli girdileri kaldırır.                           |

Bunların hiçbiri `MEMORY.md` öğesini düzenlemez, tam doctor geçişlerini çalıştırmaz veya grounded adaylarını kendiliğinden canlı kısa süreli yükseltme deposuna hazırlamaz. Grounded geçmiş yeniden oynatmayı normal derin yükseltme hattına beslemek için bunun yerine CLI akışını kullanın:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Bu işlem, grounded kalıcı adayları kısa süreli dreaming deposuna hazırlar; `DREAMS.md` ise inceleme yüzeyi olarak kalır.

## Ayrıntılı davranış ve gerekçe

<AccordionGroup>
  <Accordion title="0. İsteğe bağlı güncelleme (git kurulumları)">
    Bu bir git çalışma kopyasıysa ve doctor etkileşimli olarak çalışıyorsa doctor'ı çalıştırmadan önce güncelleme (fetch/rebase/build) yapmayı önerir.
  </Accordion>
  <Accordion title="1. Yapılandırma normalleştirmesi">
    Doctor, eski değer biçimlerini geçerli şemaya normalleştirir. Geçerli Talk konuşma yapılandırması `talk.provider` + `talk.providers.<provider>` şeklindedir; gerçek zamanlı ses yapılandırması ise `talk.realtime.*` altındadır. Doctor, eski `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` biçimlerini sağlayıcı eşlemesine dönüştürür ve eski üst düzey gerçek zamanlı seçicileri (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) `talk.realtime` biçimine dönüştürür.

    Doctor ayrıca `plugins.allow` boş değilse ve araç politikası joker karakter veya plugin'e ait araç girdileri kullanıyorsa uyarır. `tools.allow: ["*"]` yalnızca gerçekten yüklenen plugin'lerden gelen araçlarla eşleşir; özel plugin izin listesini atlamaz.

  </Accordion>
  <Accordion title="2. Eski yapılandırma anahtarı geçişleri">
    Yapılandırma, etkin bir geçişi olan kullanım dışı bırakılmış bir anahtar içerdiğinde diğer komutlar çalışmayı reddeder ve `openclaw doctor` komutunu çalıştırmanızı ister. Doctor hangi eski anahtarların bulunduğunu açıklar, uyguladığı geçişi gösterir ve `~/.openclaw/openclaw.json` öğesini güncellenmiş şemayla yeniden yazar. Gateway başlangıcı eski yapılandırma biçimlerini reddeder ve `openclaw doctor --fix` komutunu çalıştırmanızı ister; başlangıç sırasında `openclaw.json` öğesini yeniden yazmaz. Cron iş deposu geçişleri de `openclaw doctor --fix` tarafından gerçekleştirilir.

    <Note>
      Doctor, bir anahtar kullanımdan kaldırıldıktan sonra yalnızca yaklaşık iki ay
      boyunca otomatik geçişleri taşır. Daha eski anahtarların (örneğin özgün
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, üst düzey `agent.*` veya çoklu aracı öncesi
      yapılandırma biçimindeki üst düzey `identity`) artık geçiş yolu
      yoktur; bunları kullanan yapılandırma artık yeniden yazılmak yerine
      doğrulamada başarısız olur. Doctor'ın devam edebilmesi için bu anahtarları
      geçerli yapılandırma başvurusuna göre elle düzeltin.
    </Note>

    Etkin geçişler:

    | Eski anahtar                                                                                    | Geçerli anahtar                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | kaldırıldı (WebChat kullanımdan kaldırıldı)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (ve hesap başına)      | `...threadBindings.idleHours`                                               |
    | eski `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | eski üst düzey gerçek zamanlı Talk seçicileri (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS konuşmacı alanları `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (Discord dışındaki tüm kanallar)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (Discord dahil tüm kanallar)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (Gateway başlangıcı ayrıca `api` değeri gelecekteki/bilinmeyen bir enum değeri olan sağlayıcıları kapalı biçimde başarısız olmak yerine atlar) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | kaldırıldı (eski Chrome uzantısı aktarma ayarı)                             |
    | `mcp.servers.*.type` (CLI'ye özgü diğer adlar)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | kaldırıldı (Codex app-server, Codex'e özgü çalışma alanı araçlarını her zaman yerel tutar) |
    | `commands.modelsWrite`                                                                           | kaldırıldı (`/models add` kullanım dışıdır)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | kaldırıldı (tam `NO_REPLY` artık görünür yedek metne dönüştürülmez)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | kaldırıldı (oluşturulan sistem isteminin sahibi OpenClaw'dır)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | kaldırıldı (yavaş model/sağlayıcı zaman aşımları için `models.providers.<id>.timeoutSeconds` kullanın; aracı/çalıştırma zaman aşımı tavanının altında tutulur) |
    | üst düzey `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (herhangi bir düzey)                                                            | kaldırıldı (bellek dizinleri her aracının veritabanında bulunur)                       |
    | üst düzey `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` politika kimlikleri                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | kaldırıldı (kullanım dışı)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Yukarıdaki `plugins.entries.voice-call.config.*` satırları, `openclaw
      doctor` tarafından
      değil, her yapılandırma yüklemesinde Voice Call plugin'inin kendisi tarafından normalleştirilir. Plugin ayrıca başlangıçta `openclaw
      doctor --fix` öğesine işaret eden bir uyarı kaydeder ancak doctor şu anda bu anahtarlar için
      `openclaw.json` öğesini yeniden yazmaz; değişikliği çalışma zamanında
      uygulayan, plugin'in kendi normalleştirmesidir.
    </Note>

    Çok hesaplı kanallar için hesap varsayılanı rehberi:

    - İki veya daha fazla `channels.<channel>.accounts` girdisi `channels.<channel>.defaultAccount` veya `accounts.default` olmadan yapılandırılmışsa doctor, yedek yönlendirmenin beklenmedik bir hesabı seçebileceği konusunda uyarır.
    - `channels.<channel>.defaultAccount` bilinmeyen bir hesap kimliğine ayarlanmışsa doctor uyarır ve yapılandırılmış hesap kimliklerini listeler.

  </Accordion>
  <Accordion title="2b. OpenCode sağlayıcı geçersiz kılmaları">
    `models.providers.opencode`, `opencode-zen` veya `opencode-go` öğelerini manuel olarak eklediyseniz bunlar `openclaw/plugin-sdk/llm` kaynağındaki yerleşik OpenCode kataloğunu geçersiz kılar. Bu durum, modelleri yanlış API'ye yönlendirebilir veya maliyetleri sıfırlayabilir. Doctor, geçersiz kılmayı kaldırabilmeniz ve model başına API yönlendirmesi ile maliyetleri geri yükleyebilmeniz için uyarır.
  </Accordion>
  <Accordion title="2c. Tarayıcı geçişi ve Chrome MCP hazır olma durumu">
    Tarayıcı yapılandırmanız hâlâ kaldırılan Chrome uzantısı yolunu gösteriyorsa doctor, bunu geçerli ana makine yerelindeki Chrome MCP bağlanma modeline normalleştirir (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` kaldırıldı).

    Doctor ayrıca `defaultProfile: "user"` veya yapılandırılmış bir `existing-session` profili kullandığınızda ana makine yerelindeki Chrome MCP yolunu denetler:

    - varsayılan otomatik bağlantı profilleri için Google Chrome'un aynı ana makinede yüklü olup olmadığını denetler
    - algılanan Chrome sürümünü denetler ve Chrome 144'ün altındaysa uyarır
    - tarayıcının inceleme sayfasında uzaktan hata ayıklamayı etkinleştirmenizi hatırlatır (örneğin `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` veya `edge://inspect/#remote-debugging`)

    Doctor, Chrome tarafındaki ayarı sizin için etkinleştiremez. Ana makine yerelindeki Chrome MCP için yine de gateway/node ana makinesinde yerel olarak çalışan Chromium tabanlı bir 144+ tarayıcı, etkinleştirilmiş uzaktan hata ayıklama ve tarayıcıda onaylanmış ilk bağlanma izin istemi gerekir.

    Buradaki hazır olma durumu yalnızca yerel bağlanma ön koşullarını kapsar. Existing-session, geçerli Chrome MCP rota sınırlarını korur; `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler gibi gelişmiş rotalar için hâlâ yönetilen bir tarayıcı veya ham CDP profili gerekir. Bu denetim Docker, sandbox, uzak tarayıcı veya ham CDP kullanmaya devam eden diğer başsız akışlar için geçerli değildir.

  </Accordion>
  <Accordion title="2d. OAuth TLS ön koşulları">
    Bir OpenAI Codex OAuth profili yapılandırıldığında doctor, yerel Node/OpenSSL TLS yığınının sertifika zincirini doğrulayabildiğini denetlemek için OpenAI yetkilendirme uç noktasını yoklar. Yoklama bir sertifika hatasıyla (örneğin `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, süresi dolmuş sertifika veya kendinden imzalı sertifika) başarısız olursa doctor, platforma özgü düzeltme yönergelerini yazdırır. Homebrew Node kullanılan macOS'ta düzeltme genellikle `brew postinstall ca-certificates` şeklindedir. `--deep` ile gateway sağlıklı olsa bile yoklama çalışır.
  </Accordion>
  <Accordion title="2e. Codex OAuth sağlayıcı geçersiz kılmaları">
    Daha önce `models.providers.openai-codex` altında eski OpenAI aktarım ayarları eklediyseniz bunlar yerleşik Codex OAuth sağlayıcı yolunu gölgeleyebilir. Doctor, Codex OAuth ile birlikte bu eski aktarım ayarlarını gördüğünde eski aktarım geçersiz kılmasını kaldırabilmeniz veya yeniden yazabilmeniz ve geçerli yönlendirme davranışını geri yükleyebilmeniz için uyarır. Özel proxy'ler ve yalnızca üstbilgi geçersiz kılmaları desteklenmeye devam eder ve bu uyarıyı tetiklemez; ancak kullanıcı tarafından oluşturulan bu istek rotaları örtük Codex seçimi için uygun değildir.
  </Accordion>
  <Accordion title="2f. Codex rota onarımı">
    Doctor, eski `openai-codex/*` model başvurularını denetler. Yerel Codex altyapı yönlendirmesi standart `openai/*` model başvurularını kullanır, ancak ön ek tek başına hiçbir zaman Codex'i seçmez. Çalışma zamanı politikası ayarlanmamışsa veya `auto` ise yalnızca kullanıcı tarafından oluşturulmuş istek geçersiz kılması bulunmayan, tam olarak resmî HTTPS Platform Responses veya ChatGPT Responses rotası uygundur. Bkz. [OpenAI örtük aracı çalışma zamanı](/tr/providers/openai#implicit-agent-runtime).

    `--fix` / `--repair` modunda doctor; birincil modeller, yedekler, görüntü/video oluşturma modelleri, heartbeat/alt aracı/compaction geçersiz kılmaları, hook'lar, kanal modeli geçersiz kılmaları ve kalıcı eski oturum rota durumu dâhil olmak üzere etkilenen varsayılan aracı ve aracı başına başvuruları yeniden yazar:

    - `openai-codex/gpt-*`, `openai/gpt-*` olur.
    - Codex amacı, onarılan aracı model başvuruları için sağlayıcı/model kapsamındaki `agentRuntime.id: "codex"` girdilerine taşınır.
    - Çalışma zamanı seçimi sağlayıcı/model kapsamında olduğundan eski tüm aracı çalışma zamanı yapılandırması ve kalıcı oturum çalışma zamanı sabitlemeleri kaldırılır.
    - Onarılan eski model başvurusunun eski kimlik doğrulama yolunu korumak için Codex yönlendirmesine ihtiyaç duyması dışında mevcut sağlayıcı/model çalışma zamanı politikası korunur.
    - Mevcut model yedek listeleri, eski girdileri yeniden yazılarak korunur; kopyalanan model başına ayarlar eski anahtardan standart `openai/*` anahtarına taşınır.
    - Kalıcı oturum `modelProvider`/`providerOverride`, `model`/`modelOverride`, yedek bildirimleri ve kimlik doğrulama profili sabitlemeleri, keşfedilen tüm aracı oturum depolarında onarılır.
    - Doctor ayrıca eski `agentRuntime.id: "codex-cli"` sabitlemelerini (ayrı bir eski çalışma zamanı kimliği) `agents.defaults`, `agents.list[]` ve `models.providers.*` model girdilerinin tamamında `"codex"` olarak onarır.
    - `/codex ...`, "yerel bir Codex konuşmasını sohbetten denetle veya bağla" anlamına gelir.
    - `/acp ...` veya `runtime: "acp"`, "haricî ACP/acpx bağdaştırıcısını kullan" anlamına gelir.

  </Accordion>
  <Accordion title="2g. Oturum rotası temizliği">
    Doctor ayrıca yapılandırılmış modelleri veya çalışma zamanını Codex gibi bir plugin'in sahip olduğu rotadan taşımanızın ardından keşfedilen aracı oturum depolarını, otomatik oluşturulmuş eski rota durumu açısından tarar.

    `openclaw doctor --fix`; `modelOverrideSource: "auto"` model sabitlemeleri, çalışma zamanı model meta verileri, sabitlenmiş altyapı kimlikleri, CLI oturum bağlamaları ve otomatik kimlik doğrulama profili geçersiz kılmaları gibi otomatik oluşturulmuş eski durumları, bunların sahibi olan rota artık yapılandırılmadığında temizleyebilir. Açık kullanıcı veya eski oturum model seçimleri manuel inceleme için bildirilir ve değiştirilmeden bırakılır; bu rota artık amaçlanmıyorsa bunları `/model ...`, `/new` ile değiştirin veya oturumu sıfırlayın.

  </Accordion>
  <Accordion title="3. Eski durum geçişleri (disk düzeni)">
    Doctor, eski disk üzeri düzenleri geçerli yapıya geçirebilir:

    - Oturum deposu + transkriptler: `~/.openclaw/sessions/` konumundan `~/.openclaw/agents/<agentId>/sessions/` konumuna
    - Aracı dizini: `~/.openclaw/agent/` konumundan `~/.openclaw/agents/<agentId>/agent/` konumuna
    - WhatsApp kimlik doğrulama durumu (Baileys): eski `~/.openclaw/credentials/*.json` konumundan (`oauth.json` hariç) `~/.openclaw/credentials/whatsapp/<accountId>/...` konumuna (varsayılan hesap kimliği: `default`)

    Bu geçişler azami çabayla gerçekleştirilir ve eş etkili işlemlerdir; doctor, yedek olarak geride bıraktığı tüm eski klasörler için uyarı verir. Gateway/CLI ayrıca eski oturumları ve aracı dizinini başlangıçta otomatik olarak geçirir; böylece geçmiş, kimlik doğrulama ve modeller, doctor manuel olarak çalıştırılmadan aracı başına yola yerleşir. WhatsApp kimlik doğrulaması kasıtlı olarak yalnızca `openclaw doctor` aracılığıyla geçirilir. Talk sağlayıcısı/sağlayıcı eşlemesi normalleştirmesi yapısal eşitliğe göre karşılaştırma yaptığından, yalnızca anahtar sırası farklılıkları artık tekrarlanan etkisiz `doctor --fix` değişikliklerini tetiklemez.

  </Accordion>
  <Accordion title="3a. Eski plugin manifestosu geçişleri">
    Doctor, kullanımdan kaldırılmış üst düzey yetenek anahtarlarını (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) bulmak için yüklü tüm plugin manifestolarını tarar. Bulduğunda bunları `contracts` nesnesine taşımayı ve manifesto dosyasını yerinde yeniden yazmayı önerir. Bu geçiş eş etkilidir; `contracts` zaten aynı değerlere sahipse eski anahtar, veriler yinelenmeden kaldırılır.
  </Accordion>
  <Accordion title="3b. Eski cron deposu geçişleri">
    Doctor ayrıca zamanlayıcının uyumluluk amacıyla hâlâ kabul ettiği eski iş şekilleri için cron iş deposunu (varsayılan olarak `~/.openclaw/cron/jobs.json` veya geçersiz kılındığında `cron.store`) denetler.

    Geçerli cron temizlemeleri şunları içerir:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - üst düzey yük alanları (`message`, `model`, `thinking`, ...) → `payload`
    - üst düzey teslim alanları (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - yükteki `provider` teslim diğer adları → açık `delivery.channel`
    - eski `notify: true` webhook yedek işleri → ayarlandığında `cron.webhook` kaynağından açık webhook teslimi; duyuru işleri sohbet teslimini korur ve `delivery.completionDestination` alır. `cron.webhook` ayarlanmamışsa çalışma zamanı teslimi bunu hiçbir zaman okumadığından, hedefi olmayan işler için etkisiz üst düzey `notify` işaretçisi kaldırılır (duyuru dâhil mevcut teslim korunur).

    Gateway ayrıca yükleme sırasında hatalı biçimlendirilmiş cron satırlarını temizleyerek geçerli işlerin çalışmaya devam etmesini sağlar. Ham hatalı satırlar, `jobs.json` içinden kaldırılmadan önce etkin deponun yanındaki `jobs-quarantine.json` konumuna kopyalanır; doctor, manuel olarak inceleyebilmeniz veya onarabilmeniz için karantinaya alınan satırları bildirir.

    Gateway başlangıcı çalışma zamanı izdüşümünü normalleştirir ve üst düzey `notify` işaretçisini yok sayar, ancak doctor onarımı için kalıcı cron yapılandırmasına dokunmaz. `cron.webhook` ayarlanmamışsa doctor, geçiş hedefi olmayan işler için (`delivery.mode` yok/eksik, kullanılamayan bir webhook hedefi veya mevcut duyuru/sohbet teslimi) etkisiz işaretçiyi kaldırır ve mevcut teslimi değiştirmeden bırakır; böylece tekrarlanan `doctor --fix` çalıştırmaları artık aynı iş için tekrar uyarı vermez. `cron.webhook` ayarlanmış ancak geçerli bir HTTP(S) URL'si değilse doctor yine de uyarır ve URL'yi düzeltebilmeniz için işaretçiyi bırakır.

    Linux'ta doctor ayrıca kullanıcının crontab'ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çağırıyorsa uyarır. Ana makine yerelindeki bu betiğin bakımı geçerli OpenClaw tarafından yapılmaz ve cron, systemd kullanıcı veri yoluna erişemediğinde `~/.openclaw/logs/whatsapp-health.log` konumuna yanlış `Gateway inactive` iletileri yazabilir. Eski crontab girdisini `crontab -e` ile kaldırın; geçerli sistem durumu denetimleri için `openclaw channels status --probe`, `openclaw doctor` ve `openclaw gateway status` kullanın.

  </Accordion>
  <Accordion title="3c. Oturum kilidi temizliği">
    Doctor, bir oturum anormal biçimde sonlandığında geride kalan eski yazma kilidi dosyalarını bulmak için her aracı oturum dizinini tarar. Bulunan her kilit dosyası için yolu, PID'yi, PID'nin hâlâ etkin olup olmadığını, kilidin yaşını ve eski sayılıp sayılmadığını (ölü PID, hatalı biçimlendirilmiş sahip meta verileri, 30 dakikadan eski olma veya OpenClaw dışı bir işleme ait olduğu kanıtlanan etkin PID) bildirir. `--fix` / `--repair` modunda ölü, sahipsiz, yeniden kullanılmış, hatalı biçimlendirilmiş ve eski ya da OpenClaw dışı sahipleri olan kilitleri otomatik olarak kaldırır. Hâlâ etkin bir OpenClaw işleminin sahip olduğu eski kilitler bildirilir ancak doctor'ın etkin bir transkript yazıcısının bağlantısını kesmemesi için yerinde bırakılır.
  </Accordion>
  <Accordion title="3d. Oturum transkripti dalı onarımı">
    Doctor, 2026.4.24 istem transkripti yeniden yazma hatasının oluşturduğu yinelenen dal şeklini bulmak için aracı oturumu JSONL dosyalarını tarar: OpenClaw dâhilî çalışma zamanı bağlamını içeren terk edilmiş bir kullanıcı sırası ve aynı görünür kullanıcı istemini içeren etkin bir kardeş dal. `--fix` / `--repair` modunda doctor, etkilenen her dosyayı özgün dosyanın yanına yedekler ve gateway geçmişi ile bellek okuyucularının artık yinelenen sıraları görmemesi için transkripti etkin dala göre yeniden yazar.
  </Accordion>
  <Accordion title="4. Durum bütünlüğü denetimleri (oturum kalıcılığı, yönlendirme ve güvenlik)">
    Durum dizini, operasyonel beyin sapıdır. Kaybolursa başka yerde yedekleriniz olmadığı sürece oturumları, kimlik bilgilerini, günlükleri ve yapılandırmayı kaybedersiniz.

    Doctor şunları denetler:

    - **Durum dizini eksik**: yıkıcı durum kaybı konusunda uyarır, dizini yeniden oluşturmanızı ister ve eksik verileri kurtaramayacağını hatırlatır.
    - **Durum dizini izinleri**: yazılabilirliği doğrular; izinleri düzeltmeyi önerir (ve sahip/grup uyuşmazlığı algılandığında bir `chown` ipucu verir).
    - **macOS bulutla eşitlenen durum dizini**: eşitleme destekli yollar daha yavaş G/Ç'ye ve kilit/eşitleme yarışlarına yol açabileceğinden, durum iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) veya `~/Library/CloudStorage/...` altında çözümlendiğinde uyarır.
    - **Linux SD veya eMMC durum dizini**: SD/eMMC destekli rastgele G/Ç daha yavaş olabileceğinden ve oturum ile kimlik bilgisi yazımları altında daha hızlı aşınabileceğinden, durum bir `mmcblk*` bağlama kaynağına çözümlendiğinde uyarır.
    - **Linux geçici durum dizini**: oturumlar, kimlik bilgileri, yapılandırma ve SQLite durumu (WAL/günlük yan dosyalarıyla birlikte) yeniden başlatmada kaybolduğundan, durum `tmpfs` veya `ramfs` konumuna çözümlendiğinde uyarır. Docker `overlay` bağlamaları, kapsayıcı varlığını sürdürdüğü sürece yazılabilir katmanları ana makine yeniden başlatmalarında kalıcı olduğu için kasıtlı olarak işaretlenmez.
    - **Oturum dizinleri eksik**: geçmişi kalıcı kılmak ve `ENOENT` çökmelerini önlemek için `sessions/` ile oturum deposu dizini gereklidir.
    - **Transkript uyuşmazlığı**: yakın tarihli oturum girdilerinde transkript dosyaları eksik olduğunda uyarır.
    - **Ana oturum "1 satırlık JSONL"**: ana transkript yalnızca bir satır içerdiğinde işaretler (geçmiş birikmiyordur).
    - **Birden çok durum dizini**: ana dizinler genelinde birden çok `~/.openclaw` klasörü bulunduğunda veya `OPENCLAW_STATE_DIR` başka bir konumu gösterdiğinde uyarır (geçmiş kurulumlar arasında bölünebilir).
    - **Uzak mod hatırlatıcısı**: `gateway.mode=remote` ise doctor, uzak ana makinede çalıştırmanızı hatırlatır (durum orada bulunur).
    - **Yapılandırma dosyası izinleri**: `~/.openclaw/openclaw.json` grup/dünya tarafından okunabiliyorsa uyarır ve izinleri `600` olarak sıkılaştırmayı önerir.

  </Accordion>
  <Accordion title="5. Model kimlik doğrulama durumu (OAuth süresinin dolması)">
    Doctor, kimlik doğrulama deposundaki OAuth profillerini inceler, belirteçlerin süresi dolmak üzereyken veya dolduğunda uyarır ve güvenli olduğunda bunları yenileyebilir. Anthropic OAuth/belirteç profili güncelliğini yitirmişse bir Anthropic API anahtarı veya Anthropic kurulum belirteci yolunu önerir. Yenileme istemleri yalnızca etkileşimli olarak (TTY) çalıştırıldığında görünür; `--non-interactive` yenileme girişimlerini atlar.

    Bir OAuth yenilemesi kalıcı olarak başarısız olduğunda (örneğin `refresh_token_reused`, `invalid_grant` veya bir sağlayıcının yeniden oturum açmanızı istemesi), doctor yeniden kimlik doğrulaması gerektiğini bildirir ve çalıştırılacak tam `openclaw models auth login --provider ...` komutunu yazdırır.

    Doctor ayrıca kısa bekleme süreleri (hız sınırları/zaman aşımları/kimlik doğrulama hataları) veya daha uzun süreli devre dışı bırakmalar (faturalandırma/kredi hataları) nedeniyle geçici olarak kullanılamayan kimlik doğrulama profillerini bildirir.

    Belirteçleri macOS Keychain'de bulunan eski Codex OAuth profilleri (dosya tabanlı yan dosya düzeninden önceki eski ilk katılım), yalnızca doctor tarafından onarılır. Keychain destekli eski belirteçleri satır içinde `auth-profiles.json` konumuna taşımak için etkileşimli bir terminalden `openclaw doctor --fix` komutunu bir kez çalıştırın; bundan sonra gömülü turlar (Telegram, cron, alt ajan gönderimi) bunları standart OpenAI OAuth profilleri olarak çözümler.

  </Accordion>
  <Accordion title="6. Hooks model doğrulaması">
    `hooks.gmail.model` ayarlanmışsa doctor, model başvurusunu kataloğa ve izin verilenler listesine göre doğrular; çözümlenemediğinde veya izin verilmediğinde uyarır.
  </Accordion>
  <Accordion title="7. Sandbox imajı onarımı">
    Sandbox kullanımı etkinleştirildiğinde doctor, Docker imajlarını denetler ve geçerli imaj eksikse oluşturmayı veya eski adlara geçmeyi önerir.
  </Accordion>
  <Accordion title="7b. Plugin kurulumu temizliği">
    Doctor, `openclaw doctor --fix` / `openclaw doctor --repair` modunda OpenClaw tarafından oluşturulmuş eski plugin bağımlılığı hazırlama durumunu kaldırır: güncelliğini yitirmiş oluşturulmuş bağımlılık kökleri, eski kurulum hazırlama dizinleri, önceki paketlenmiş plugin bağımlılığı onarım kodundan kalan paket içi artıklar ve geçerli paketlenmiş manifesti gölgeleyebilen, paketlenmiş `@openclaw/*` pluginlerinin yetim kalmış veya kurtarılmış yönetilen npm kopyaları. Doctor ayrıca ana makinenin `openclaw` paketini, `peerDependencies.openclaw` bildiren yönetilen npm pluginlerine yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket içi çalışma zamanı içe aktarımları, güncellemelerden veya npm onarımlarından sonra çözümlenmeye devam eder.

    Doctor ayrıca yapılandırma bunlara başvuruyor ancak yerel plugin kayıt defteri bunları bulamıyorsa eksik indirilebilir pluginleri yeniden kurabilir (önemli `plugins.entries`, yapılandırılmış kanal/sağlayıcı/arama ayarları, yapılandırılmış ajan çalışma zamanları). Paket güncellemeleri sırasında doctor, çekirdek paket değiştirilirken plugin paketlerini yeniden kurmaktan kaçınır; yapılandırılmış bir plugin hâlâ kurtarma gerektiriyorsa güncellemeden sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. Aşağıdaki kapsayıcı imajı başlatma istisnası dışında, Gateway başlatma ve yapılandırmayı yeniden yükleme işlemleri paket onarımını çalıştırmaz; plugin kurulumları açık doctor/install/update işlemleri olarak kalır.

    Kapsayıcılaştırılmış Gateway başlatmanın dar kapsamlı bir yükseltme istisnası vardır: `openclaw gateway run` yeni bir OpenClaw sürümünde başladığında, hazır olma durumundan önce güvenli durum geçişlerini ve mevcut çekirdek sonrası plugin yakınsamasını çalıştırır, ardından sürüm başına bir denetim noktası kaydeder. Bu başlatma geçişi, güncelliğini yitirmiş paketlenmiş plugin kayıtlarını temizleyebilir, yerel plugin bağlantılarını onarabilir, yakınsama yolu gerektirdiğinde yapılandırılmış plugin paketlerini yeniden kurabilir ve etkin plugin yüklerini denetleyebilir. Başlatma güvenli biçimde onarım yapamazsa kapsayıcıyı normal şekilde yeniden başlatmadan önce aynı imajı, aynı bağlanmış durum/yapılandırmaya karşı `openclaw doctor --fix` ile bir kez çalıştırın.

  </Accordion>
  <Accordion title="8. Gateway hizmeti geçişleri ve temizleme ipuçları">
    Doctor eski Gateway hizmetlerini (launchd/systemd/schtasks) algılar ve bunları kaldırıp geçerli Gateway portunu kullanarak OpenClaw hizmetini kurmayı önerir. Ayrıca ek Gateway benzeri hizmetleri tarayabilir ve temizleme ipuçları yazdırabilir. Profil adlandırmalı OpenClaw Gateway hizmetleri birinci sınıf olarak kabul edilir ve "ek" olarak işaretlenmez.

    Linux'ta kullanıcı düzeyindeki Gateway hizmeti eksik ancak sistem düzeyinde bir OpenClaw Gateway hizmeti varsa doctor, ikinci bir kullanıcı düzeyi hizmeti otomatik olarak kurmaz. `openclaw gateway status --deep` veya `openclaw doctor --deep` ile inceleyin; ardından yinelenen hizmeti kaldırın ya da Gateway yaşam döngüsünü bir sistem gözetmeni yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` değerini ayarlayın.

  </Accordion>
  <Accordion title="8b. Başlangıç Matrix geçişi">
    Bir Matrix kanal hesabında bekleyen veya işlem yapılabilir eski durum geçişi olduğunda doctor (`--fix` / `--repair` modunda) geçiş öncesi bir anlık görüntü oluşturur ve ardından en iyi çaba esaslı geçiş adımlarını çalıştırır: eski Matrix durum geçişi ve eski şifrelenmiş durum hazırlığı. Her iki adım da ölümcül değildir; hatalar günlüğe kaydedilir ve başlatma devam eder. Salt okunur modda (`--fix` olmadan `openclaw doctor`) bu denetim tamamen atlanır.
  </Accordion>
  <Accordion title="8c. Cihaz eşleştirme ve kimlik doğrulama sapması">
    Doctor, normal durum geçişinin bir parçası olarak cihaz eşleştirme durumunu inceler ve şunları bildirir:

    - bekleyen ilk eşleştirme istekleri
    - zaten eşleştirilmiş cihazlar için bekleyen rol veya kapsam yükseltmeleri
    - cihaz kimliği hâlâ eşleştiği hâlde cihazın kimliği artık onaylanmış kayıtla eşleşmediğinde yapılan açık anahtar uyuşmazlığı onarımları
    - onaylanmış bir rol için etkin belirteci bulunmayan eşleştirilmiş kayıtlar
    - kapsamları onaylanmış eşleştirme temel çizgisinin dışına sapan eşleştirilmiş belirteçler
    - geçerli makineye ait, Gateway tarafındaki bir belirteç döndürmesinden önce oluşturulmuş veya güncelliğini yitirmiş kapsam meta verileri taşıyan yerel önbelleğe alınmış cihaz belirteci girdileri

    Doctor, eşleştirme isteklerini otomatik olarak onaylamaz veya cihaz belirteçlerini otomatik olarak döndürmez. Tam sonraki adımları yazdırır:

    - bekleyen istekleri `openclaw devices list` ile inceleyin
    - tam isteği `openclaw devices approve <requestId>` ile onaylayın
    - `openclaw devices rotate --device <deviceId> --role <role>` ile yeni bir belirteç döndürün
    - güncelliğini yitirmiş bir kaydı `openclaw devices remove <deviceId>` ile kaldırıp yeniden onaylayın

    Bu, ilk eşleştirmeyi bekleyen rol/kapsam yükseltmelerinden ve güncelliğini yitirmiş belirteç/cihaz kimliği sapmasından ayırarak yaygın "zaten eşleştirildi ancak hâlâ eşleştirme gerekli hatası alınıyor" açığını kapatır.

  </Accordion>
  <Accordion title="9. Güvenlik uyarıları">
    Doctor yalnızca izin verilenler listesi olmadan doğrudan mesajlara açık bir sağlayıcı veya tehlikeli biçimde yapılandırılmış bir politika gibi bir uyarı bulduğunda bir Güvenlik notu verir. Tam güvenlik envanteri için `openclaw security audit` kullanın.
  </Accordion>
  <Accordion title="10. systemd kalıcılığı (Linux)">
    Bir systemd kullanıcı hizmeti olarak çalışıyorsa doctor, Gateway'in oturum kapatıldıktan sonra çalışmaya devam etmesi için kalıcılığın etkinleştirildiğinden emin olur.
  </Accordion>
  <Accordion title="11. Çalışma alanı durumu (Skills, pluginler ve TaskFlow'lar)">
    Doctor, sağlıklı durum envanterini değil, varsayılan ajan için sorunları ve eylemleri yazdırır:

    - **Skills**: izin verilen ancak kullanılamayan skill adlarını listeler; gereksinim ayrıntıları ve tam sayılar için `openclaw skills check` kullanın.
    - **Pluginler**: yalnızca hata veren plugin kimliklerini bildirir; yüklenen, içe aktarılan, devre dışı bırakılan ve paket plugin envanteri için `openclaw plugins list` kullanın.
    - **Plugin uyumluluk uyarıları**: geçerli çalışma zamanıyla uyumluluk sorunları bulunan pluginleri işaretler.
    - **Plugin tanılamaları**: plugin kayıt defterinin yükleme sırasında verdiği tüm uyarıları veya hataları gösterir.
    - **TaskFlow kurtarma**: elle incelenmesi veya iptal edilmesi gereken şüpheli yönetilen TaskFlow'ları gösterir.
    - **Claude CLI**: yalnızca ikili dosya, kimlik doğrulama, profil, çalışma alanı veya proje dizini sorunlarını bildirir; sağlıklı yoklama ayrıntıları gösterilmez.

  </Accordion>
  <Accordion title="11b. Başlangıç dosyası boyutu">
    Doctor, çalışma alanı başlangıç dosyalarının (örneğin `AGENTS.md`, `CLAUDE.md` veya eklenen diğer bağlam dosyaları) yapılandırılmış karakter bütçesine yakın veya bu bütçenin üzerinde olup olmadığını denetler. Dosya başına ham ve eklenen karakter sayılarını, kesilme yüzdesini, kesilme nedenini (`max/file` veya `max/total`) ve toplam bütçenin bir bölümü olarak toplam eklenen karakterleri bildirir. Dosyalar kesildiğinde veya sınıra yaklaştığında doctor, `agents.defaults.bootstrapMaxChars` ve `agents.defaults.bootstrapTotalMaxChars` ayarlarını düzenlemeye yönelik ipuçları yazdırır.
  </Accordion>
  <Accordion title="11c. Kabuk tamamlama">
    Doctor, geçerli kabuk (zsh, bash, fish veya PowerShell) için sekme tamamlamanın kurulu olup olmadığını denetler:

    - Kabuk profili yavaş bir dinamik tamamlama kalıbı (`source <(openclaw completion ...)`) kullanıyorsa doctor, bunu daha hızlı önbelleğe alınmış dosya çeşidine yükseltir.
    - Tamamlama profilde yapılandırılmış ancak önbellek dosyası eksikse doctor, önbelleği otomatik olarak yeniden oluşturur.
    - Hiçbir tamamlama yapılandırılmamışsa doctor, kurulmasını ister (yalnızca etkileşimli modda; `--non-interactive` ile atlanır).

    Önbelleği elle yeniden oluşturmak için `openclaw completion --write-state` komutunu çalıştırın.

  </Accordion>
  <Accordion title="11d. Güncelliğini yitirmiş kanal plugini temizliği">
    `openclaw doctor --fix` eksik bir kanal pluginini kaldırdığında, bu plugine başvuran sahipsiz kanal kapsamlı yapılandırmayı da kaldırır: `channels.<id>` girdileri, kanalı adlandıran Heartbeat hedefleri ve `agents.*.models["<channel>/*"]` geçersiz kılmaları. Bu, kanal çalışma zamanı kaldırılmış olmasına rağmen yapılandırmanın Gateway'den hâlâ buna bağlanmasını istediği Gateway önyükleme döngülerini önler.
  </Accordion>
  <Accordion title="12. Gateway kimlik doğrulama denetimleri (yerel belirteç)">
    Doctor, yerel Gateway belirteç kimlik doğrulamasının hazır olma durumunu denetler.

    - Belirteç modu bir belirteç gerektiriyor ve hiçbir belirteç kaynağı yoksa doctor, bir tane oluşturmayı önerir.
    - `gateway.auth.token` SecretRef tarafından yönetiliyor ancak kullanılamıyorsa doctor uyarır ve bunu düz metinle üzerine yazmaz.
    - `openclaw doctor --generate-gateway-token`, yalnızca hiçbir belirteç SecretRef'i yapılandırılmamışsa oluşturmayı zorlar.

  </Accordion>
  <Accordion title="12b. Salt okunur, SecretRef duyarlı onarımlar">
    Bazı onarım akışlarının, çalışma zamanının hızlı başarısız olma davranışını zayıflatmadan yapılandırılmış kimlik bilgilerini incelemesi gerekir.

    - `openclaw doctor --fix`, hedefli yapılandırma onarımları için durum ailesi komutlarıyla aynı salt okunur SecretRef özet modelini kullanır.
    - Örnek: Telegram `allowFrom` / `groupAllowFrom` `@username` onarımı, kullanılabilir olduğunda yapılandırılmış bot kimlik bilgilerini kullanmayı dener.
    - Telegram bot belirteci SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa doctor, kimlik bilgisinin yapılandırılmış ancak kullanılamıyor olduğunu bildirir ve çökmek veya belirteci yanlışlıkla eksik olarak bildirmek yerine otomatik çözümlemeyi atlar.

  </Accordion>
  <Accordion title="13. Gateway sağlık denetimi + yeniden başlatma">
    Doctor bir sağlık denetimi çalıştırır ve gateway sağlıksız görünüyorsa yeniden başlatmayı önerir.
  </Accordion>
  <Accordion title="13b. Bellek araması hazırlığı">
    Doctor, yapılandırılmış bellek araması gömme sağlayıcısının varsayılan ajan için hazır olup olmadığını denetler. Davranış, yapılandırılmış arka uca ve sağlayıcıya bağlıdır:

    - **QMD arka ucu**: `qmd` ikili dosyasının kullanılabilir ve başlatılabilir olup olmadığını yoklar. Değilse `npm install -g @tobilu/qmd` (veya Bun eşdeğeri) ve manuel ikili dosya yolu seçeneğini içeren düzeltme yönergeleri yazdırır.
    - **Açıkça belirtilen yerel sağlayıcı**: yerel bir model dosyasını veya tanınan uzak/indirilebilir bir model URL'sini denetler. Eksikse uzak bir sağlayıcıya geçilmesini önerir.
    - **Açıkça belirtilen uzak sağlayıcı** (`openai`, `voyage` vb.): ortamda veya kimlik doğrulama deposunda bir API anahtarı bulunduğunu doğrular. Eksikse uygulanabilir düzeltme ipuçları yazdırır.
    - **Eski otomatik sağlayıcı**: `memorySearch.provider: "auto"` değerini OpenAI olarak kabul eder, OpenAI hazırlığını denetler ve `doctor --fix` bunu `provider: "openai"` olarak yeniden yazar.

    Önbelleğe alınmış bir gateway yoklama sonucu mevcut olduğunda (denetim sırasında gateway sağlıklıydı), doctor bu sonucu CLI tarafından görülebilen yapılandırmayla çapraz kontrol eder ve tüm tutarsızlıkları belirtir. Doctor, varsayılan yolda yeni bir gömme ping'i başlatmaz; canlı bir sağlayıcı denetimi istediğinizde ayrıntılı bellek durumu komutunu kullanın.

    Çalışma zamanında gömme hazırlığını doğrulamak için `openclaw memory status --deep` kullanın.

  </Accordion>
  <Accordion title="14. Kanal durumu uyarıları">
    Gateway sağlıklıysa doctor bir kanal durumu yoklaması çalıştırır ve önerilen düzeltmelerle birlikte uyarıları bildirir.
  </Accordion>
  <Accordion title="15. Gözetmen yapılandırması denetimi + onarım">
    Doctor, yüklü gözetmen yapılandırmasında (launchd/systemd/schtasks) eksik veya güncelliğini yitirmiş varsayılanları (örneğin systemd network-online bağımlılıkları ve yeniden başlatma gecikmesi) denetler. Bir uyumsuzluk bulduğunda güncelleme önerir ve hizmet dosyasını/görevi geçerli varsayılanlarla yeniden yazabilir.

    Notlar:

    - `openclaw doctor`, gözetmen yapılandırmasını yeniden yazmadan önce onay ister.
    - `openclaw doctor --yes`, varsayılan onarım istemlerini kabul eder.
    - `openclaw doctor --fix`, önerilen düzeltmeleri istem göstermeden uygular (`--repair` bir diğer addır).
    - `openclaw doctor --fix --force`, özel gözetmen yapılandırmalarının üzerine yazar.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gateway hizmetinin yaşam döngüsü açısından doctor'ı salt okunur tutar. Hizmet sağlığını bildirmeye ve hizmet dışı onarımları çalıştırmaya devam eder ancak yaşam döngüsünü harici bir gözetmen yönettiğinden hizmet yükleme/başlatma/yeniden başlatma/önyükleme işlemlerini, gözetmen yapılandırması yeniden yazımlarını ve eski hizmet temizliğini atlar.
    - Linux'ta doctor, eşleşen systemd gateway birimi etkinken komut/giriş noktası meta verilerini yeniden yazmaz. Ayrıca yinelenen hizmet taraması sırasında etkin olmayan, eski olmayan ek gateway benzeri birimleri yok sayar; böylece yardımcı hizmet dosyaları temizleme gürültüsü oluşturmaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa doctor hizmet yükleme/onarımı, SecretRef'i doğrular ancak çözümlenmiş düz metin belirteç değerlerini gözetmen hizmet ortamı meta verilerinde kalıcı hâle getirmez.
    - Doctor, eski LaunchAgent, systemd veya Windows Scheduled Task kurulumlarının satır içinde gömdüğü, yönetilen `.env`/SecretRef destekli hizmet ortamı değerlerini algılar ve bu değerlerin gözetmen tanımı yerine çalışma zamanı kaynağından yüklenmesi için hizmet meta verilerini yeniden yazar.
    - Doctor, `gateway.port` değiştikten sonra hizmet komutunun hâlâ eski bir `--port` değerine sabitlendiğini algılar ve hizmet meta verilerini geçerli bağlantı noktasına göre yeniden yazar.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse doctor, uygulanabilir yönergelerle yükleme/onarım yolunu engeller.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa doctor, mod açıkça ayarlanana kadar yükleme/onarımı engeller.
    - Linux kullanıcı systemd birimleri için doctor belirteç sapması denetimleri, hizmet kimlik doğrulama meta verilerini karşılaştırırken hem `Environment=` hem de `EnvironmentFile=` kaynaklarını içerir.
    - Yapılandırma en son daha yeni bir sürüm tarafından yazılmışsa doctor hizmet onarımları, eski bir OpenClaw ikili dosyasından gateway hizmetini yeniden yazmayı, durdurmayı veya yeniden başlatmayı reddeder. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - `openclaw gateway install --force` aracılığıyla her zaman tam yeniden yazmayı zorlayabilirsiniz.

  </Accordion>
  <Accordion title="16. Gateway çalışma zamanı + bağlantı noktası tanılama">
    Doctor, hizmet çalışma zamanını (PID, son çıkış durumu) inceler ve hizmet yüklü olduğu hâlde gerçekte çalışmadığında uyarır. Ayrıca gateway bağlantı noktasında (varsayılan `18789`) bağlantı noktası çakışmalarını denetler ve olası nedenleri (gateway zaten çalışıyor, SSH tüneli) bildirir.
  </Accordion>
  <Accordion title="17. Gateway çalışma zamanı en iyi uygulamaları">
    Doctor, gateway hizmeti Bun veya sürüm yöneticisi tarafından yönetilen bir Node yolunda (`nvm`, `fnm`, `volta`, `asdf` vb.) çalıştığında uyarır. Bun, OpenClaw'ın `node:sqlite` durum deposunu açamaz; bu nedenle onarımlar eski Bun hizmetlerini Node'a geçirir. Sürüm yöneticisi yolları, hizmet kabuk başlatma yapılandırmanızı yüklemediği için yükseltmelerden sonra bozulabilir. Doctor, kullanılabilir olduğunda bir sistem Node kurulumuna (Homebrew/apt/choco) geçiş yapmayı önerir.

    Yeni yüklenen veya onarılan macOS LaunchAgent'ları, etkileşimli kabuk PATH'ini kopyalamak yerine standart bir sistem PATH'i (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) kullanır; böylece Homebrew tarafından yönetilen sistem ikili dosyaları kullanılabilir kalırken Volta, asdf, fnm, pnpm ve diğer sürüm yöneticisi dizinleri, Node alt süreçlerinin hangi Node'u çözümlediğini değiştirmez. Linux hizmetleri açık ortam köklerini (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) ve kararlı kullanıcı ikili dosya dizinlerini korumaya devam eder ancak tahmin edilen sürüm yöneticisi yedek dizinleri yalnızca bu dizinler diskte mevcutsa hizmet PATH'ine yazılır.

  </Accordion>
  <Accordion title="18. Yapılandırma yazımı + sihirbaz meta verileri">
    Doctor, tüm yapılandırma değişikliklerini kalıcı hâle getirir ve doctor çalıştırmasını kaydetmek için sihirbaz meta verilerini damgalar.
  </Accordion>
  <Accordion title="19. Çalışma alanı ipuçları (yedekleme + bellek sistemi)">
    Doctor, eksik olduğunda bir çalışma alanı bellek sistemi önerir ve çalışma alanı hâlihazırda git altında değilse bir yedekleme ipucu yazdırır.

    Çalışma alanı yapısı ve git yedeklemesi (önerilen: özel GitHub veya GitLab) hakkında eksiksiz bir kılavuz için [/concepts/agent-workspace](/tr/concepts/agent-workspace) sayfasına bakın.

  </Accordion>
</AccordionGroup>

## İlgili

- [Gateway işletim kılavuzu](/tr/gateway)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
