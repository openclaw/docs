---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl bir araya getirildiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-03T21:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw her ajan çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her ajan çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, tam OpenClaw'a ait istemi değiştirmeden önbelleğe duyarlı istem yönlendirmesi katkısı sunabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış küçük bir çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özel ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu uyumluluk veya gerçekten genel istem
değişiklikleri için tutun; normal sağlayıcı davranışı için kullanmayın.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona sabitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsamı, doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özel yönlendirme ekler.

## Yapı

İstem bilinçli olarak kompakt tutulur ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araçlarda doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Yürütme Eğilimi**: kompakt tamamına-erme yönlendirmesi: eyleme geçirilebilir isteklerde aynı tur içinde harekete geç, tamamlanana veya engellenene kadar devam et, zayıf araç sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışındaki davranışlardan veya gözetimi atlatmaktan kaçınmak için kısa sınır hatırlatıcısı.
- **Skills** (varsa): modele beceri talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı `config.schema.lookup` ile güvenle inceleme, yapılandırmayı `config.patch` ile yamama, tam yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı isteğiyle çalıştırma. Yalnızca sahip için olan `gateway` aracı ayrıca, korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw dokümanlarına yerel yol (repo veya npm paketi) ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edilir)**: önyükleme dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkinleştirildiğinde): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcı yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi söz dizimi.
- **Heartbeat'ler**: varsayılan ajan için heartbeat'ler etkinleştirildiğinde heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

OpenClaw, **Proje Bağlamı** dahil büyük ve kararlı içeriği dahili istem önbelleği sınırının üstünde tutar. Control UI gömme yönlendirmesi, **Mesajlaşma**, **Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeat'ler** ve **Çalışma Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece önek önbellekleri olan yerel arka uçlar, kararlı çalışma alanı önekini kanal turları arasında yeniden kullanabilir. Araç açıklamaları da kabul edilen şema bu çalışma zamanı ayrıntısını zaten taşıyorsa geçerli kanal adlarını gömmekten kaçınmalıdır.

Araçlar bölümü, uzun süren işler için çalışma zamanı yönlendirmesi de içerir:

- gelecekteki takipler (`check back later`, hatırlatıcılar, yinelenen işler) için `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlı `process` yoklaması yerine cron kullanın
- `exec` / `process` yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için kullanın
- otomatik tamamlama uyandırması etkin olduğunda, komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, giriş veya müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt ajan tamamlanması push tabanlıdır ve istekte bulunana otomatik duyuru yapar
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutunu döngü içinde yoklamayın

Deneysel `update_plan` aracı etkinleştirildiğinde, Araçlar ayrıca modele bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını söyler.

Sistem istemindeki güvenlik sınırları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak politikayı zorla uygulatmazlar. Katı uygulama için araç politikası, exec onayları, sandbox ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık ajana önce bu yerel onay UI'sına güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel bir `/approve` komutu eklemelidir.

## İstem modları

OpenClaw alt ajanlar için daha küçük sistem istemleri işleyebilir. Çalışma zamanı her çalıştırma için bir `promptMode` belirler (kullanıcıya açık bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Bellek Geri Çağırma**, **OpenClaw Kendi Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeat'ler** bölümlerini atlar. Araçlar, **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilen bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, fazladan enjekte edilen istemler **Grup Sohbeti Bağlamı** yerine **Alt Ajan Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmalarında OpenClaw, doğrudan/grup sohbeti bağlamı çözümlenmiş konuşmaya özel `NO_REPLY` davranışını zaten içeriyorsa genel **Sessiz Yanıtlar** bölümünü atlayabilir. Bu, token mekaniklerinin hem genel sistem isteminde hem de kanal bağlamında tekrarlanmasını önler.

## İstem anlık görüntüleri

OpenClaw, Codex çalışma zamanının mutlu yolu için işlenmiş istem anlık görüntülerini `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` altında commit'li tutar. Bunlar, seçili uygulama sunucusu iş parçacığı/tur parametrelerini ve Telegram doğrudan, Discord grup ve heartbeat turları için yeniden oluşturulmuş model bağlı istem katmanı yığınını işler. Bu yığın; Codex'in model kataloğu/önbellek şeklinden oluşturulan sabitlenmiş bir Codex `gpt-5.5` model istem fikstürünü, Codex mutlu yol izin geliştirici metnini, OpenClaw geliştirici talimatlarını, OpenClaw sağladığında tur kapsamlı işbirliği modu talimatlarını, kullanıcı tur girişini ve dinamik araç teknik özelliklerine referansları içerir.

Sabitlenmiş Codex model istem fikstürünü `pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak betik, Codex'in çalışma zamanı önbelleğini önce `$CODEX_HOME/models_cache.json` konumunda, sonra `~/.codex/models_cache.json` konumunda arar ve ancak ardından `~/code/codex/codex-rs/models-manager/models.json` konumundaki bakımcı Codex checkout kuralına geri döner. Bu kaynakların hiçbiri yoksa komut, commit'li fikstürü değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json` dosyasından yenilemek için `--catalog <path>` geçirin.

Bu anlık görüntüler hâlâ bayt bayt ham bir OpenAI istek yakalaması değildir. Codex, OpenClaw iş parçacığı ve tur parametrelerini gönderdikten sonra Codex çalışma zamanı içinde `AGENTS.md`, ortam bağlamı, anılar, uygulama/Plugin talimatları ve yerleşik Default işbirliği modu talimatları gibi çalışma zamanına ait çalışma alanı bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve sapmayı `pnpm prompt:snapshots:check` ile doğrulayın. CI sapma kontrolünü ek sınır shard'ında çalıştırır; böylece istem değişiklikleri ve anlık görüntü güncellemeleri aynı PR'a bağlı kalır.

## Çalışma alanı önyükleme enjeksiyonu

Önyükleme dosyaları kırpılır ve **Proje Bağlamı** altına eklenir; böylece model, açık okumalara gerek duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`

Bu dosyaların tümü, dosyaya özel bir kapı uygulanmadığı sürece her turda **bağlam penceresine enjekte edilir**. Varsayılan ajan için heartbeat'ler devre dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda normal çalıştırmalarda `HEARTBEAT.md` atlanır. Enjekte edilen dosyaları kısa tutun — özellikle zamanla büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md`.

Bir oturum yerel Codex harness üzerinde çalıştığında, Codex `AGENTS.md` dosyasını kendi proje dokümanı keşfiyle yükler. OpenClaw yine de kalan önyükleme dosyalarını çözümler ve bunları Codex yapılandırma talimatları olarak iletir; böylece `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md`, `AGENTS.md` dosyasını çoğaltmadan aynı çalışma alanı bağlamı rolünü korur.

<Note>
`memory/*.md` günlük dosyaları normal önyükleme Proje Bağlamı'nın parçası **değildir**. Olağan turlarda bunlara gerektiğinde `memory_search` ve `memory_get` araçları üzerinden erişilir; bu nedenle model bunları açıkça okumadıkça bağlam penceresinden sayılmazlar. Çıplak `/new` ve `/reset` turları istisnadır: çalışma zamanı, o ilk tur için yakın tarihli günlük belleği tek seferlik bir başlangıç bağlamı bloğu olarak başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretleyiciyle kısaltılır. Dosya başına maksimum boyut `agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 12000). Dosyalar genelindeki toplam enjekte edilmiş önyükleme içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder. Kısaltma gerçekleştiğinde OpenClaw, Proje Bağlamı'na bir uyarı bloğu enjekte edebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`; varsayılan: `once`).

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder (diğer önyükleme dosyaları, alt ajan bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, enjekte edilen önyükleme dosyalarını mutasyona uğratmak veya değiştirmek için bu adımı `agent:bootstrap` üzerinden kesebilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Ajanın daha az genel görünmesini istiyorsanız [SOUL.md Kişilik Rehberi](/tr/concepts/soul) ile başlayın.

Enjekte edilen her dosyanın ne kadar katkı sağladığını (ham ve enjekte edilmiş, kısaltma, ayrıca araç şeması ek yükü) incelemek için `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi bilindiğinde sistem istemi özel bir **Geçerli Tarih ve Saat** bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi içermez).

Ajanın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model override'ı ayarlayabilir (`model=default` bunu temizler).

Şununla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir Skills listesi** (`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun Skills yoksa Skills bölümü atlanır.

Uygunluk; skill meta veri kapılarını, çalışma zamanı ortam/yapılandırma kontrollerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkin ajan skill izin listesini içerir.

Plugin ile paketlenmiş Skills yalnızca sahip Plugin etkin olduğunda uygundur. Bu, araç Plugin'lerinin bu yönlendirmenin tamamını her araç açıklamasına doğrudan gömmeden daha derin işletim rehberleri sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını hâlâ mümkün kılarken temel istemi küçük tutar.

Skills listesi bütçesi Skills alt sistemine aittir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına override: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlandırılmış çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/enjeksiyon boyutlandırmasından ayrı tutar.

## Belgeler

Sistem istemi bir **Belgeler** bölümü içerir. Yerel belgeler mevcut olduğunda, yerel OpenClaw belgeleri dizinine işaret eder (`docs/`, bir Git checkout içinde veya paketlenmiş npm paketi belgelerinde). Yerel belgeler yoksa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout’ları, ajanın kodu doğrudan inceleyebilmesi için yerel kaynak kökünü sunar. Paket kurulumları GitHub kaynak URL’sini içerir ve belgeler eksik veya güncel olmadığında ajana kaynağı orada incelemesini söyler. İstem ayrıca herkese açık belge yansısını, topluluk Discord’unu ve Skills keşfi için ClawHub’ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce belgelere başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorar). Özellikle yapılandırma için ajanları, alan düzeyinde kesin belgeler ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup`’a, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
