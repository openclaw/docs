---
read_when:
    - Sistem prompt metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem promptunun neleri içerdiği ve nasıl oluşturulduğu
title: Sistem istemi
x-i18n:
    generated_at: "2026-06-28T00:31:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw her ajan çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve runtime varsayılan istemi kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her ajan çalıştırmasına enjekte edilir.

İstem birleştirme üç katmandan oluşur:

- `buildAgentSystemPrompt` istemi açık girdilerden işler. Saf bir işleyici olarak
  kalmalı ve global yapılandırmayı doğrudan okumamalıdır.
- `resolveAgentSystemPromptConfig`, belirli bir ajan için sahip gösterimi, TTS ipuçları,
  model takma adları, bellek alıntılama modu ve alt ajan yetkilendirme modu gibi
  yapılandırma destekli istem ayarlarını çözümler.
- Runtime adaptörleri (gömülü, CLI, komut/dışa aktarma önizlemeleri, compaction)
  araçlar, sandbox durumu, kanal yetenekleri, bağlam dosyaları ve sağlayıcı istem
  katkıları gibi canlı olguları toplar, ardından yapılandırılmış istem cephesini çağırır.

Bu, dışa aktarılan/hata ayıklama istem yüzeylerini canlı çalıştırmalarla hizalı tutarken
her runtime'a özgü ayrıntıyı tek bir monolitik oluşturucuya dönüştürmeyi önler.

Sağlayıcı plugin'leri, OpenClaw'a ait tam istemi değiştirmeden önbellek farkındalıklı
istem rehberliği katkısında bulunabilir. Sağlayıcı runtime'ı şunları yapabilir:

- adlandırılmış küçük bir çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özgü ayarlama için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu normal sağlayıcı davranışı için değil,
uyumluluk veya gerçekten global istem değişiklikleri için saklayın.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona
sabitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsam,
doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özgü rehberlik ekler.

## Yapı

İstem bilinçli olarak kompakttır ve sabit bölümler kullanır:

- **Araç Kullanımı**: yapılandırılmış araçlar için doğruluk kaynağı hatırlatıcısı ve runtime araç kullanım rehberliği.
- **Yürütme Eğilimi**: kompakt takip rehberliği: eyleme dönüştürülebilir isteklerde
  aynı tur içinde harekete geç, tamamlanana veya engellenene kadar devam et, zayıf araç
  sonuçlarından toparlan, değişken durumu canlı kontrol et ve sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışındaki davranışlardan veya gözetimi aşmaktan kaçınmaya yönelik kısa korkuluk hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele skill talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Control**: modele yapılandırma/yeniden başlatma işi için `gateway` aracını
  tercih etmesini ve CLI komutları uydurmaktan kaçınmasını söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı `config.schema.lookup` ile
  güvenli biçimde inceleme, yapılandırmayı `config.patch` ile yamama, tam yapılandırmayı
  `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı isteğiyle
  çalıştırma yöntemi. Ajan tarafındaki `gateway` aracı, korunan bu exec yollarına normalize
  olan eski `tools.bash.*` takma adları dahil olmak üzere `tools.exec.ask` /
  `tools.exec.security` değerlerini yeniden yazmayı da reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw dokümanlarına/kaynağına giden yerel yol ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edilmiş)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı runtime'ı, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: yalnızca saat dilimi (önbellek açısından kararlı; canlı saat `session_status` içinden gelir).
- **Asistan Çıktı Direktifleri**: kompakt ek, sesli not ve yanıt etiketi söz dizimi.
- **Heartbeats**: varsayılan ajan için heartbeat'ler etkin olduğunda heartbeat istemi ve onay davranışı.
- **Runtime**: host, işletim sistemi, Node, model, repo kökü (algılandığında), düşünme seviyesi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük seviyesi + /reasoning geçiş ipucu.

OpenClaw, **Proje Bağlamı** dahil olmak üzere büyük kararlı içeriği dahili istem
önbelleği sınırının üstünde tutar. Control UI yerleştirme rehberliği, **Mesajlaşma**,
**Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeats** ve **Runtime** gibi
değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece önek önbelleklerine
sahip yerel arka uçlar, kanal turları arasında kararlı çalışma alanı önekini yeniden
kullanabilir. Araç açıklamaları da, kabul edilen şema bu runtime ayrıntısını zaten
taşıyorsa geçerli kanal adlarını gömmekten kaçınmalıdır.

Araç Kullanımı bölümü uzun süren işler için runtime rehberliği de içerir:

- gelecekteki takip için (`check back later`, anımsatıcılar, yinelenen işler)
  `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya yinelenen `process`
  yoklaması yerine cron kullanın
- `exec` / `process` yalnızca şimdi başlayan ve arka planda çalışmaya devam eden
  komutlar için kullanın
- otomatik tamamlama uyanışı etkin olduğunda, komutu bir kez başlatın ve çıktı
  yayımladığında veya başarısız olduğunda push tabanlı uyanış yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale
  için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt ajan tamamlanması push tabanlıdır
  ve isteği yapan kişiye otomatik olarak geri bildirilir
- tamamlanmayı beklemek için `subagents list` / `sessions_list` komutunu döngü içinde yoklamayın

`agents.defaults.subagents.delegationMode` bu rehberliği güçlendirebilir. Varsayılan
`suggest` modu temel yönlendirmeyi korur. `prefer`, ana ajana duyarlı bir koordinatör
gibi davranmasını ve doğrudan yanıttan daha kapsamlı her şeyi `sessions_spawn`
üzerinden iletmesini söyleyen özel bir **Alt Ajan Yetkilendirmesi** bölümü ekler.
Bu yalnızca istem düzeyindedir; `sessions_spawn` aracının kullanılabilir olup olmadığını
araç ilkesi yine kontrol eder.

Deneysel `update_plan` aracı etkin olduğunda Araç Kullanımı, modele bunu yalnızca
önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress`
adım tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını da söyler.

Sistem istemindeki güvenlik korkulukları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak ilkeyi zorunlu kılmazlar. Katı yaptırım için araç ilkesi, exec onayları, sandbox ve kanal izin listeleri kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda runtime istemi artık ajana önce bu yerel
onay kullanıcı arayüzüne güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının
kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde manuel bir
`/approve` komutu içermelidir.

## İstem modları

OpenClaw alt ajanlar için daha küçük sistem istemleri işleyebilir. Runtime her
çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Bellek Geri Çağırma**, **OpenClaw
  Kendi Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**,
  **Asistan Çıktı Direktifleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve
  **Heartbeats** bölümlerini atlar. Araç Kullanımı, **Güvenlik**, sağlandığında
  **Skills**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa),
  Runtime ve enjekte edilmiş bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilmiş istemler **Grup Sohbeti Bağlamı**
yerine **Alt Ajan Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmalarında OpenClaw, görünür yanıt sözleşmesini doğrudan,
grup veya yalnızca mesaj aracı bağlamı üstlendiğinde genel **Sessiz Yanıtlar** bölümünü
atlar. Yalnızca eski otomatik grup/kanal modu `NO_REPLY` göstermelidir; doğrudan
sohbetler ve yalnızca mesaj aracı yanıtları sessiz token rehberliği almaz.

## İstem anlık görüntüleri

OpenClaw, Codex runtime mutlu yol için işlenmiş istem anlık görüntülerini
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` altında tutar. Bunlar,
seçilmiş uygulama sunucusu iş parçacığı/tur parametrelerini ve Telegram doğrudan,
Discord grup ve heartbeat turları için yeniden oluşturulmuş model bağlı istem katmanı
yığınını işler. Bu yığın; Codex'in model kataloğu/önbellek biçiminden oluşturulmuş
sabitlenmiş bir Codex `gpt-5.5` model istem fikstürünü, Codex mutlu yol izin geliştirici
metnini, OpenClaw geliştirici talimatlarını, OpenClaw sağladığında tur kapsamlı iş
birliği modu talimatlarını, kullanıcı tur girdisini ve dinamik araç belirtimlerine
referansları içerir.

Sabitlenmiş Codex model istem fikstürünü
`pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Betik varsayılan olarak
Codex runtime önbelleğini önce `$CODEX_HOME/models_cache.json` konumunda, sonra
`~/.codex/models_cache.json` konumunda arar ve ancak bundan sonra
`~/code/codex/codex-rs/models-manager/models.json` konumundaki maintainer Codex
checkout kuralına geri döner. Bu kaynaklardan hiçbiri yoksa komut, işlenmiş fikstürü
değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json` dosyasından
yenilemek için `--catalog <path>` iletin.

Bu anlık görüntüler hâlâ bayt bayt ham OpenAI istek yakalaması değildir. Codex,
OpenClaw iş parçacığı ve tur parametrelerini gönderdikten sonra Codex runtime içinde
`AGENTS.md`, ortam bağlamı, anılar, uygulama/plugin talimatları ve yerleşik Default
iş birliği modu talimatları gibi runtime'a ait çalışma alanı bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve sapmayı
`pnpm prompt:snapshots:check` ile doğrulayın. CI, istem değişiklikleri ve anlık görüntü
güncellemeleri aynı PR'a bağlı kalsın diye sapma kontrolünü ek sınır shard'ında çalıştırır.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları etkin çalışma alanından çözümlenir, ardından yaşam süreleriyle
eşleşen istem yüzeyine yönlendirilir:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcut olduğunda `MEMORY.md`

Yerel Codex harness'ında OpenClaw, kararlı çalışma alanı dosyalarını her kullanıcı
turunda tekrarlamaktan kaçınır. Codex, `AGENTS.md` dosyasını kendi proje dokümanı
keşfi üzerinden yükler. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` ve `USER.md`, Codex
geliştirici talimatları olarak iletilir. Kompakt OpenClaw skills listesi de tur
kapsamlı iş birliği geliştirici talimatları olarak iletilir. `HEARTBEAT.md` içeriği
enjekte edilmez; heartbeat turları, dosya mevcut ve boş değilse dosyaya işaret eden
bir iş birliği modu notu alır. Yapılandırılmış ajan çalışma alanındaki `MEMORY.md`
içeriği her yerel Codex turuna yapıştırılmaz; bellek araçları o çalışma alanı için
kullanılabilir olduğunda Codex turları, tur kapsamlı iş birliği geliştirici talimatlarında
küçük bir çalışma alanı belleği notu alır ve kalıcı bellek ilgili olduğunda
`memory_search` veya `memory_get` kullanmalıdır. Araçlar devre dışıysa, bellek araması
kullanılamıyorsa veya etkin çalışma alanı ajan bellek çalışma alanından farklıysa,
`MEMORY.md` normal sınırlı tur bağlamı yoluna geri döner. Etkin `BOOTSTRAP.md` içeriği
şimdilik normal tur bağlamı rolünü korur.

Codex dışı harness'larda bootstrap dosyaları, mevcut kapılarına göre OpenClaw istemine
bileşen olarak eklenmeye devam eder. Varsayılan ajan için heartbeat'ler devre dışı
olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda
`HEARTBEAT.md` normal çalıştırmalarda atlanır. Enjekte edilen dosyaları, özellikle
Codex dışı `MEMORY.md` dosyalarını kısa tutun. `MEMORY.md`, düzenlenmiş bir uzun vadeli
özet olarak kalmak üzere tasarlanmıştır; ayrıntılı günlük notlar, `memory_search` ve
`memory_get` tarafından gerektiğinde alınabilecekleri `memory/*.md` konumunda olmalıdır.
Aşırı büyük Codex dışı `MEMORY.md` dosyaları istem kullanımını artırır ve aşağıdaki
bootstrap dosyası sınırları nedeniyle kısmen enjekte edilebilir.

<Note>
`memory/*.md` günlük dosyaları normal bootstrap Proje Bağlamının parçası **değildir**. Sıradan turlarda `memory_search` ve `memory_get` araçları aracılığıyla gerektiğinde erişilirler; bu nedenle model onları açıkça okumadıkça bağlam penceresine dahil edilmezler. Çıplak `/new` ve `/reset` turları istisnadır: runtime, ilk tur için tek seferlik başlangıç bağlamı bloğu olarak son günlük belleği başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretleyiciyle kısaltılır. Dosya başına en büyük boyut
`agents.defaults.bootstrapMaxChars` tarafından denetlenir (varsayılan: 20000).
Dosyalar genelinde enjekte edilen toplam bootstrap içeriği
`agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır
(varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder.
Kısaltma gerçekleştiğinde, OpenClaw kısa bir sistem istemi uyarı bildirimi enjekte
edebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` ile denetleyin
(`off`, `once`, `always`; varsayılan: `always`). Ayrıntılı ham/enjekte edilmiş
sayımlar `/context`, `/status`, doctor ve günlükler gibi tanı çıktılarında kalır.

Bellek dosyaları için kısaltma veri kaybı değildir: dosya diskte olduğu gibi kalır.
Yerel Codex üzerinde `MEMORY.md`, kullanılabilir olduğunda bellek araçlarıyla
istek üzerine okunur; araçlar çalıştırılamadığında sınırlandırılmış istem geri dönüşü
kullanılır. Diğer harness'lerde model, belleği doğrudan okuyana veya arayana kadar
yalnızca kısaltılmış enjekte edilmiş kopyayı görür. `MEMORY.md` orada tekrar tekrar
kısaltılıyorsa, onu daha kısa ve kalıcı bir özete damıtın ve ayrıntılı geçmişi
`memory/*.md` içine taşıyın ya da bootstrap sınırlarını bilinçli olarak artırın.

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (diğer bootstrap
dosyaları, alt ajan bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, enjekte edilen bootstrap dosyalarını değiştirmek veya yenisiyle
değiştirmek için `agent:bootstrap` üzerinden bu adımı yakalayabilir (örneğin
`SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Ajanın daha az genel konuşmasını istiyorsanız,
[SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Enjekte edilen her dosyanın ne kadar katkı sağladığını incelemek için (ham ve enjekte
edilmiş, kısaltma, ayrıca araç şeması ek yükü), `/context list` veya `/context detail`
kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi bilindiğinde sistem istemi özel bir **Geçerli Tarih ve Saat**
bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini**
içerir (dinamik saat veya saat biçimi yoktur).

Ajanın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı bir
zaman damgası satırı içerir. Aynı araç, isteğe bağlı olarak oturum başına model
geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolu** ve içerikten
türetilmiş `<version>` işaretleyicisini içeren kompakt bir **kullanılabilir Skills listesi**
(`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen konumdaki
(workspace, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read`
kullanmasını ve `<version>` önceki bir turdan farklıysa bir skill'i yeniden okumasını
söyler. Uygun Skills yoksa Skills bölümü atlanır.

Yerel Codex turları bu listeyi, hafif cron turları dışında, tur başına kullanıcı girdisi
yerine tur kapsamlı iş birliği geliştirici talimatları olarak alır; hafif cron turları
tam zamanlanmış istemi korur. Diğer harness'ler normal istem bölümünü korur.

Konum, `skills/personal/foo/SKILL.md` gibi iç içe bir skill'i gösterebilir. İç içe
yerleşim yalnızca düzenleme amaçlıdır; istem yine de `SKILL.md` frontmatter içindeki
düz skill adını kullanır.

Uygunluk; skill metadata geçitlerini, çalışma zamanı ortamı/yapılandırma denetimlerini
ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkili ajan
skill izin listesini içerir.

Plugin ile paketlenmiş Skills yalnızca sahip Plugin etkinleştirildiğinde uygundur.
Bu, araç Plugin'lerinin tüm bu kılavuzu doğrudan her araç açıklamasına gömmeden daha
derin işletim kılavuzları sunmasına olanak tanır.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını mümkün kılmaya devam ederken temel istemi küçük tutar.

Skills listesi bütçesi Skills alt sistemi tarafından sahiplenilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlandırılmış çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction
sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/enjeksiyon boyutlandırmasından
ayrı tutar.

## Dokümantasyon

Sistem istemi bir **Dokümantasyon** bölümü içerir. Yerel dokümanlar kullanılabilir
olduğunda, yerel OpenClaw dokümanları dizinine işaret eder (bir Git checkout içinde
`docs/` veya paketlenmiş npm paketi dokümanları). Yerel dokümanlar kullanılamıyorsa,
[https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout'ları, ajanın kodu doğrudan
inceleyebilmesi için yerel kaynak kökünü gösterir. Paket kurulumları GitHub kaynak
URL'sini içerir ve dokümanlar eksik veya eski olduğunda ajana kaynağı orada gözden
geçirmesini söyler. İstem ayrıca herkese açık doküman aynasını, topluluk Discord'unu
ve Skills keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir.
Dokümanları, model OpenClaw'un nasıl çalıştığını anlamadan önce bellek/günlük notlar,
oturumlar, araçlar, Gateway, yapılandırma, komutlar veya proje bağlamı dahil olmak
üzere OpenClaw öz bilgisi için otorite olarak çerçeveler. İstem, modele önce yerel
dokümanları (veya yerel dokümanlar yoksa doküman aynasını) kullanmasını ve AGENTS.md,
proje bağlamı, workspace/profil/bellek notları ve `memory_search` öğelerini OpenClaw
tasarım veya uygulama bilgisi yerine talimat bağlamı ya da kullanıcı belleği olarak
ele almasını söyler. Dokümanlar sessiz veya eskiyse, model bunu belirtmeli ve kaynağı
incelemelidir. İstem ayrıca modele, erişimi olduğunda `openclaw status` komutunu
kendisinin çalıştırmasını, yalnızca erişimi olmadığında kullanıcıya sormasını söyler.
Özellikle yapılandırma için, ajanları tam alan düzeyinde dokümanlar ve kısıtlamalar
için `gateway` araç eylemi `config.schema.lookup`'a, ardından daha geniş kılavuz için
`docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına
yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan workspace'i](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
