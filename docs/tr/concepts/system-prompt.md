---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl oluşturulduğu
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-04T07:04:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw, her agent çalıştırması için özel bir sistem promptu oluşturur. Prompt **OpenClaw'a aittir** ve pi-coding-agent varsayılan promptunu kullanmaz.

Prompt, OpenClaw tarafından derlenir ve her agent çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, tam OpenClaw'a ait promptu değiştirmeden önbellek farkındalığına sahip prompt rehberliği katkısı sağlayabilir. Sağlayıcı runtime'ı şunları yapabilir:

- küçük bir adlandırılmış çekirdek bölüm kümesini değiştirmek (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- prompt önbellek sınırının üstüne **kararlı bir önek** enjekte etmek
- prompt önbellek sınırının altına **dinamik bir sonek** enjekte etmek

Model ailesine özel ayarlama için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` prompt mutasyonunu normal sağlayıcı davranışı için değil,
uyumluluk veya gerçekten global prompt değişiklikleri için saklayın.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona
kilitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsamı,
doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özel rehberlik ekler.

## Yapı

Prompt kasıtlı olarak kompakttır ve sabit bölümler kullanır:

- **Araç Kullanımı**: yapılandırılmış araç gerçeğin kaynağı hatırlatıcısı ve runtime araç kullanım rehberliği.
- **Yürütme Eğilimi**: kompakt takip rehberliği: eyleme dönüştürülebilir isteklerde
  aynı tur içinde hareket et, tamamlanana veya engellenene kadar devam et, zayıf araç
  sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışlı davranıştan veya gözetimi atlatmaktan kaçınmak için kısa koruma hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele skill talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı
  `config.schema.lookup` ile güvenli şekilde inceleme, `config.patch` ile yapılandırmaya yama uygulama,
  tam yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı
  isteğiyle çalıştırma. Yalnızca sahip kullanımlı `gateway` aracı da eski `tools.bash.*`
  takma adları dahil olmak üzere `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder;
  bu takma adlar korunan exec yollarına normalize edilir.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve ne zaman okunacakları.
- **Çalışma Alanı Dosyaları (enjekte edilmiş)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı runtime'ı, sandbox yollarını ve yükseltilmiş exec'in mevcut olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcının yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi söz dizimi.
- **Heartbeat'ler**: varsayılan agent için Heartbeat'ler etkinleştirildiğinde Heartbeat promptu ve onay davranışı.
- **Runtime**: host, işletim sistemi, Node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

OpenClaw, **Proje Bağlamı** dahil büyük kararlı içeriği dahili prompt önbellek
sınırının üstünde tutar. Control UI gömme rehberliği, **Mesajlaşma**, **Ses**,
**Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeat'ler** ve **Runtime** gibi
değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece önek
önbelleklerine sahip yerel backend'ler, kanal turları arasında kararlı çalışma
alanı önekini yeniden kullanabilir. Araç açıklamaları da kabul edilen şema bu
runtime ayrıntısını zaten taşıyorsa geçerli kanal adlarını gömmekten kaçınmalıdır.

Araç Kullanımı bölümü, uzun süren işler için runtime rehberliği de içerir:

- gelecekteki takip işleri (`check back later`, anımsatıcılar, yinelenen işler)
  için `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlanan `process`
  yoklaması yerine Cron kullanın
- `exec` / `process` öğelerini yalnızca şimdi başlayan ve arka planda çalışmaya
  devam eden komutlar için kullanın
- otomatik tamamlama uyandırması etkin olduğunda komutu bir kez başlatın ve çıktı
  yaydığında veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, giriş veya müdahale
  için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlaması
  push tabanlıdır ve istekte bulunan kişiye otomatik olarak duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` öğelerini
  döngü içinde yoklamayın

Deneysel `update_plan` aracı etkin olduğunda Araç Kullanımı ayrıca modele bunu
yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını söyler.

Sistem promptundaki güvenlik korumaları tavsiye niteliğindedir. Model davranışına rehberlik ederler ancak politikayı zorunlu kılmazlar. Katı uygulama için araç politikası, exec onayları, sandbox ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda runtime promptu artık agent'a önce
bu yerel onay UI'ına güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının
kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel bir
`/approve` komutu içermelidir.

## Prompt modları

OpenClaw, alt agent'lar için daha küçük sistem promptları işleyebilir. Runtime her çalıştırma için
bir `promptMode` ayarlar (kullanıcıya açık bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent'lar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw
  Kendi Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**,
  **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeat'ler** bölümlerini atlar. Araç Kullanımı,
  **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (bilindiğinde), Runtime ve enjekte edilen
  bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ekstra enjekte edilen promptlar **Grup Sohbeti Bağlamı**
yerine **Alt Agent Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmaları için OpenClaw, doğrudan/grup sohbeti bağlamı
çözümlenmiş konuşmaya özel `NO_REPLY` davranışını zaten içerdiğinde genel
**Sessiz Yanıtlar** bölümünü atlayabilir. Bu, token mekaniğinin hem global sistem
promptunda hem de kanal bağlamında tekrarlanmasını önler.

## Prompt anlık görüntüleri

OpenClaw, Codex runtime mutlu yolu için kaydedilmiş prompt anlık görüntülerini
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` altında tutar. Bunlar
seçili app-server thread/tur parametrelerini ve Telegram doğrudan, Discord grup
ve Heartbeat turları için yeniden oluşturulmuş model bağlı prompt katmanı yığınını
işler. Bu yığın, Codex'in model katalog/önbellek şeklinden oluşturulmuş sabitlenmiş
bir Codex `gpt-5.5` model prompt fikstürünü, Codex mutlu yolu izin geliştirici metnini,
OpenClaw geliştirici talimatlarını, OpenClaw sağladığında tur kapsamlı işbirliği modu
talimatlarını, kullanıcı tur girdisini ve dinamik araç spesifikasyonlarına referansları içerir.

Sabitlenmiş Codex model prompt fikstürünü
`pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak script,
Codex'in runtime önbelleğini önce `$CODEX_HOME/models_cache.json`, sonra
`~/.codex/models_cache.json` konumunda arar ve ancak bundan sonra
`~/code/codex/codex-rs/models-manager/models.json` adresindeki maintainer Codex
checkout geleneğine geri döner. Bu kaynakların hiçbiri yoksa komut, kaydedilmiş
fikstürü değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json`
dosyasından yenilemek için `--catalog <path>` geçirin.

Bu anlık görüntüler hâlâ birebir ham OpenAI istek yakalaması değildir. Codex,
OpenClaw thread ve tur parametrelerini gönderdikten sonra Codex runtime içinde
`AGENTS.md`, ortam bağlamı, anılar, uygulama/Plugin talimatları ve yerleşik Default
işbirliği modu talimatları gibi runtime'a ait çalışma alanı bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve drift'i
`pnpm prompt:snapshots:check` ile doğrulayın. CI, prompt değişiklikleri ve anlık
görüntü güncellemeleri aynı PR'a bağlı kalsın diye ek boundary shard içinde drift
kontrolünü çalıştırır.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model, açık okumalara gerek duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcut olduğunda `MEMORY.md`

Bu dosyaların tümü, dosyaya özel bir geçit uygulanmadığı sürece her turda
**bağlam penceresine enjekte edilir**. Varsayılan agent için Heartbeat'ler devre
dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false
olduğunda normal çalıştırmalarda `HEARTBEAT.md` atlanır. Enjekte edilen dosyaları
kısa tutun — özellikle zamanla büyüyebilen ve beklenmedik derecede yüksek bağlam
kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md`.

Bir oturum yerel Codex harness üzerinde çalıştığında Codex, kendi proje belgesi
keşfi üzerinden `AGENTS.md` yükler. OpenClaw yine de kalan bootstrap dosyalarını
çözer ve bunları Codex yapılandırma talimatları olarak iletir; böylece `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve
`MEMORY.md`, `AGENTS.md` dosyasını çoğaltmadan aynı çalışma alanı bağlamı rolünü korur.

<Note>
`memory/*.md` günlük dosyaları normal bootstrap Proje Bağlamının parçası **değildir**. Olağan turlarda bunlara `memory_search` ve `memory_get` araçları üzerinden gerektiğinde erişilir; bu nedenle model açıkça okumadıkça bağlam penceresinden sayılmazlar. Yalın `/new` ve `/reset` turları istisnadır: runtime, bu ilk tur için son günlük belleği tek seferlik başlangıç bağlamı bloğu olarak başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretleyiciyle kısaltılır. Dosya başına maksimum boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 12000).
Dosyalar genelinde toplam enjekte edilen bootstrap içeriği
`agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000).
Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder. Kısaltma
olduğunda OpenClaw kısa bir sistem promptu uyarı bildirimi enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`). Ayrıntılı ham/enjekte edilmiş sayımlar `/context`, `/status`,
doctor ve günlükler gibi tanılamalarda kalır.

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (diğer bootstrap dosyaları,
alt agent bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, enjekte edilen bootstrap dosyalarını değiştirmek veya yerine başka dosyalar koymak
için (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek) bu adımı
`agent:bootstrap` üzerinden yakalayabilir.

Agent'ın daha az genel görünmesini istiyorsanız
[SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Her enjekte edilen dosyanın ne kadar katkıda bulunduğunu incelemek için (ham ve enjekte edilmiş, kısaltma, ayrıca araç şeması yükü) `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi bilindiğinde sistem promptu ayrılmış bir **Geçerli Tarih ve Saat** bölümü içerir. Promptu önbellek açısından kararlı tutmak için artık yalnızca
**saat dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Agent'ın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model
geçersiz kılması ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir Skills listesi**
(`formatSkillsForPrompt`) enjekte eder. Prompt, modele listelenen konumdaki
(çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için
`read` kullanmasını söyler. Uygun skill yoksa Skills bölümü atlanır.

Uygunluk; skill metadata geçitlerini, runtime ortamı/yapılandırma kontrollerini
ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkili
agent skill izin listesini içerir.

Plugin ile paketlenmiş skills yalnızca sahip Plugin'leri etkin olduğunda uygundur.
Bu, araç Plugin'lerinin bu rehberliğin tamamını doğrudan her araç açıklamasına
gömmeden daha derin işletim kılavuzları sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını hâlâ etkinleştirirken temel promptu küçük tutar.

Skills listesi bütçesi Skills alt sistemi tarafından sahiplenilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlandırılmış çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/ekleme boyutlandırmasından ayrı tutar.

## Dokümantasyon

Sistem istemi bir **Dokümantasyon** bölümü içerir. Yerel dokümanlar kullanılabilir olduğunda, yerel OpenClaw dokümanları dizinine işaret eder (bir Git checkout içinde `docs/` veya paketlenmiş npm paketi dokümanları). Yerel dokümanlar kullanılamıyorsa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout’ları yerel kaynak kökünü sunar, böylece ajan kodu doğrudan inceleyebilir. Paket kurulumları GitHub kaynak URL’sini içerir ve dokümanlar eksik veya güncel değilse ajana kaynağı orada incelemesini söyler. İstem ayrıca Skills keşfi için herkese açık doküman yansısını, topluluk Discord’unu ve ClawHub’ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce dokümanlara başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorarak). Özellikle yapılandırma için, ajanları kesin alan düzeyi dokümanları ve kısıtlamaları almak üzere `gateway` araç eylemi `config.schema.lookup`’a, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
