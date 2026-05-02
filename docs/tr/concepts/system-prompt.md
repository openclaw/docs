---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyon davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl bir araya getirildiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-02T22:18:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw, her agent çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her agent çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, OpenClaw'a ait tam istemin yerini almadan önbellek farkındalığı olan istem rehberliği katkısında bulunabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış küçük bir çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özgü ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu normal sağlayıcı davranışı için değil, uyumluluk veya gerçekten küresel istem değişiklikleri için saklayın.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona kilitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsamı, doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özgü rehberlik ekler.

## Yapı

İstem kasıtlı olarak kompakttır ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araç doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı rehberliği.
- **Yürütme Eğilimi**: kompakt takip rehberliği: eyleme geçirilebilir isteklerde aynı tur içinde hareket et,
  tamamlanana veya engellenene kadar devam et, zayıf araç sonuçlarından toparlan,
  değişken durumu canlı olarak kontrol et ve sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışlı davranıştan veya gözetimi atlatmaktan kaçınmak için kısa koruma hatırlatıcısı.
- **Skills** (var olduğunda): modele Skills talimatlarını isteğe bağlı olarak nasıl yükleyeceğini söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı
  `config.schema.lookup` ile güvenli şekilde inceleme, `config.patch` ile yapılandırmaya yama uygulama, tam
  yapılandırmayı `config.apply` ile değiştirme ve `update.run` aracını yalnızca açık kullanıcı
  isteği üzerine çalıştırma. Yalnızca sahip `gateway` aracı, korumalı exec yollarına normalize edilen eski `tools.bash.*`
  takma adları dahil olmak üzere `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı da reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw dokümanlarının yerel yolu (repo veya npm paketi) ve ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edildi)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkinken): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcı yerel saati, zaman dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan agent için Heartbeat'ler etkinleştirildiğinde Heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, Node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

OpenClaw, **Proje Bağlamı** dahil olmak üzere büyük kararlı içeriği
dahili istem önbelleği sınırının üzerinde tutar. Control UI gömme rehberliği, **Mesajlaşma**, **Ses**, **Grup Sohbeti Bağlamı**,
**Tepkiler**, **Heartbeats** ve **Çalışma Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir;
böylece önek önbellekleri olan yerel arka uçlar, kararlı çalışma alanı önekini
kanal turları arasında yeniden kullanabilir. Araç açıklamaları da, kabul edilen şema bu çalışma zamanı ayrıntısını zaten taşıyorsa
geçerli kanal adlarını gömmekten kaçınmalıdır.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı rehberliği içerir:

- gelecekteki takip için (`check back later`, hatırlatıcılar, yinelenen işler)
  `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlanan `process`
  yoklaması yerine Cron kullanın
- `exec` / `process` araçlarını yalnızca şimdi başlayan ve arka planda çalışmaya
  devam eden komutlar için kullanın
- otomatik tamamlama uyandırması etkin olduğunda, komutu bir kez başlatın ve çıktı verdiğinde veya başarısız olduğunda
  push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, giriş veya müdahale için
  `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlaması
  push tabanlıdır ve istekte bulunana otomatik olarak duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını döngü içinde yoklamayın

Deneysel `update_plan` aracı etkinleştirildiğinde, Araçlar ayrıca modele
bunu yalnızca basit olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını söyler.

Sistem istemindeki güvenlik korumaları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak ilkeyi zorla uygulamazlar. Zorunlu uygulama için araç politikası, exec onayları, sandbox kullanımı ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda, çalışma zamanı istemi artık agent'a
önce bu yerel onay UI'sına güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya
manuel onayın tek yol olduğunu söylediğinde manuel
`/approve` komutu eklemelidir.

## İstem modları

OpenClaw, alt agent'lar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir
`promptMode` ayarlar (kullanıcıya yönelik bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent'lar için kullanılır; **Skills**, **Bellek Geri Çağırma**, **OpenClaw
  Kendi Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**,
  **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeats** bölümlerini atlar. Araçlar, **Güvenlik**,
  Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilen
  bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilen istemler **Grup Sohbeti Bağlamı** yerine **Alt Agent
Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmaları için OpenClaw, doğrudan/grup sohbeti bağlamı zaten çözümlenmiş
konuşmaya özgü `NO_REPLY` davranışını içerdiğinde genel **Sessiz Yanıtlar**
bölümünü atlayabilir. Bu, token mekaniklerinin hem küresel sistem isteminde hem de kanal bağlamında
tekrarlanmasını önler.

## İstem anlık görüntüleri

OpenClaw, Codex/message-tool çalışma zamanı için işlenen başarılı yol istem anlık görüntülerini
`test/fixtures/agents/prompt-snapshots/happy-path/` altında tutar. Bunlar,
seçilmiş uygulama sunucusu thread/turn parametrelerini ve Telegram doğrudan, Discord grup ve Heartbeat turları için yeniden oluşturulmuş model bağlı istem
katman yığınını işler. Bu yığın,
Codex'in model kataloğu/önbellek biçiminden oluşturulmuş sabitlenmiş bir Codex `gpt-5.5` model istem fikstürünü, Codex başarılı yol izin geliştirici metnini,
OpenClaw geliştirici talimatlarını, kullanıcı turu girdisini ve dinamik
araç özelliklerine referansları içerir.

Sabitlenmiş Codex model istem fikstürünü
`pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak betik,
Codex'in çalışma zamanı önbelleğini önce `$CODEX_HOME/models_cache.json`, sonra
`~/.codex/models_cache.json` konumunda arar ve ancak bundan sonra bakımcı Codex
checkout geleneği olan `~/code/codex/codex-rs/models-manager/models.json` yoluna geri döner. Bu
kaynakların hiçbiri yoksa komut, işlenen fikstürü değiştirmeden çıkar.
Belirli bir `models_cache.json` veya `models.json` dosyasından yenilemek için `--catalog <path>` geçin.

Bu anlık görüntüler hâlâ bire bir ham OpenAI isteği yakalaması değildir. OpenClaw thread ve turn
parametrelerini gönderdikten sonra Codex, Codex çalışma zamanı içinde `AGENTS.md`, ortam
bağlamı, bellekler, uygulama/Plugin talimatları ve gelecekteki iş birliği modu
talimatları gibi çalışma zamanına ait çalışma alanı bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve sapmayı
`pnpm prompt:snapshots:check` ile doğrulayın. CI, istem değişiklikleri ve anlık görüntü güncellemelerinin aynı
PR'ye bağlı kalması için sapma kontrolünü ek
sınır shard'ında çalıştırır.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları kırpılır ve modelin açık okumalara gerek duymadan kimlik ve profil bağlamını görmesi için **Proje Bağlamı** altına eklenir:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`

Bu dosyaların tümü, dosyaya özgü bir kapı uygulanmadıkça her turda **bağlam penceresine enjekte edilir**.
`HEARTBEAT.md`, varsayılan agent için Heartbeat'ler devre dışı olduğunda veya
`agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda normal çalıştırmalarda atlanır. Enjekte edilen
dosyaları kısa tutun — özellikle zamanla büyüyebilen ve beklenmedik derecede
yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md`.

<Note>
`memory/*.md` günlük dosyaları normal bootstrap Proje Bağlamı'nın parçası **değildir**. Sıradan turlarda bunlara `memory_search` ve `memory_get` araçları aracılığıyla isteğe bağlı olarak erişilir; bu nedenle model bunları açıkça okumadıkça bağlam penceresine dahil edilmezler. Çıplak `/new` ve `/reset` turları istisnadır: çalışma zamanı, ilk tur için tek seferlik başlangıç bağlamı bloğu olarak son günlük belleği başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretçiyle kısaltılır. Dosya başına en yüksek boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 12000). Dosyalar genelindeki toplam enjekte edilmiş bootstrap
içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır
(varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretçisi enjekte eder. Kısaltma
olduğunda, OpenClaw Proje Bağlamı'na bir uyarı bloğu enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
varsayılan: `once`) ile kontrol edin.

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder (diğer bootstrap dosyaları
alt agent bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar bu adımı `agent:bootstrap` aracılığıyla yakalayıp enjekte edilen bootstrap dosyalarını mutasyona uğratabilir veya değiştirebilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Agent'ın daha az genel görünmesini istiyorsanız
[SOUL.md Kişilik Rehberi](/tr/concepts/soul) ile başlayın.

Her enjekte edilen dosyanın ne kadar katkıda bulunduğunu incelemek için (ham ve enjekte edilen, kısaltma, ayrıca araç şeması ek yükü) `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Sistem istemi, kullanıcı zaman dilimi bilindiğinde özel bir **Geçerli Tarih ve Saat** bölümü içerir.
İstem önbelleğini kararlı tutmak için artık yalnızca
**zaman dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Agent'ın geçerli saate ihtiyaç duyduğu durumlarda `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model
override'ı ayarlayabilir (`model=default` bunu temizler).

Şununla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills bulunduğunda OpenClaw, her Skill için **dosya yolunu** içeren kompakt bir **kullanılabilir Skills listesi**
(`formatSkillsForPrompt`) enjekte eder. İstem,
modele listelenen konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını
söyler. Uygun Skills yoksa
Skills bölümü atlanır.

Uygunluk; Skill metadata kapılarını, çalışma zamanı ortamı/yapılandırma kontrollerini
ve `agents.defaults.skills` veya
`agents.list[].skills` yapılandırıldığında etkin agent Skill izin listesini içerir.

Plugin ile paketlenen Skills yalnızca sahip Plugin'leri etkin olduğunda uygundur.
Bu, araç Plugin'lerinin bu rehberliğin tamamını doğrudan her araç açıklamasına gömmeden
daha derin işletim rehberleri sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli Skill kullanımını hâlâ mümkün kılarken temel istemi küçük tutar.

Skills listesi bütçesi Skills alt sistemine aittir:

- Küresel varsayılan: `skills.limits.maxSkillsPromptChars`
- Agent başına override: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/enjeksiyon boyutlandırmasından
ayrı tutar.

## Dokümantasyon

Sistem istemi bir **Dokümantasyon** bölümü içerir. Yerel dokümanlar kullanılabilir olduğunda, yerel OpenClaw dokümanları dizinine (`docs/`, bir Git checkout içinde veya paketlenmiş npm paketi dokümanları) işaret eder. Yerel dokümanlar kullanılamıyorsa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout’ları, ajanın kodu doğrudan inceleyebilmesi için yerel kaynak kökünü açığa çıkarır. Paket kurulumları GitHub kaynak URL’sini içerir ve dokümanlar eksik veya güncel olmadığında ajana kaynağı orada incelemesini söyler. İstem ayrıca Skills keşfi için genel doküman aynasını, topluluk Discord’unu ve ClawHub’ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele, OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce dokümanlara başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorar). Özellikle yapılandırma için, ajanları tam alan düzeyi dokümanları ve kısıtlamaları için `gateway` araç eylemi `config.schema.lookup`’a, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
