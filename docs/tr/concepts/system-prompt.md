---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl derlendiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-10T19:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw her agent çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her agent çalıştırmasına enjekte edilir.

İstem birleştirme üç katmandan oluşur:

- `buildAgentSystemPrompt` istemi açık girdilerden işler. Saf bir işleyici
  olarak kalmalı ve global yapılandırmayı doğrudan okumamalıdır.
- `resolveAgentSystemPromptConfig`, belirli bir agent için sahip görüntüsü, TTS
  ipuçları, model takma adları, bellek alıntılama modu ve alt-agent yetki devri
  modu gibi yapılandırma destekli istem ayarlarını çözümler.
- Çalışma zamanı bağdaştırıcıları (gömülü, CLI, komut/dışa aktarma önizlemeleri,
  Compaction) araçlar, sandbox durumu, kanal yetenekleri, bağlam dosyaları ve
  sağlayıcı istem katkıları gibi canlı olguları toplar, ardından yapılandırılmış
  istem cephesini çağırır.

Bu, dışa aktarılan/hata ayıklama istem yüzeylerini canlı çalıştırmalarla hizalı
tutarken her çalışma zamanına özgü ayrıntıyı tek parça bir oluşturucuya
dönüştürmez.

Sağlayıcı Plugin'leri, OpenClaw'a ait istemin tamamını değiştirmeden önbellek
duyarlı istem yönlendirmesi katkısında bulunabilir. Sağlayıcı çalışma zamanı:

- küçük bir adlandırılmış çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir ön ek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir son ek** enjekte edebilir

Sağlayıcıya ait katkıları model ailesine özgü ayarlamalar için kullanın. Eski
`before_prompt_build` istem mutasyonunu normal sağlayıcı davranışı için değil,
uyumluluk veya gerçekten global istem değişiklikleri için saklayın.

OpenAI GPT-5 ailesi örtüşmesi, çekirdek yürütme kuralını küçük tutar ve persona
sabitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsamı,
doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özgü yönlendirme
ekler.

## Yapı

İstem kasıtlı olarak kompakttır ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araç doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Yürütme Eğilimi**: kompakt takip yönlendirmesi: eyleme geçirilebilir
  isteklerde aynı turda harekete geç, tamamlanana veya engellenene kadar devam
  et, zayıf araç sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve
  sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışındaki davranışlardan veya gözetimi atlatmaktan kaçınmak için kısa koruma hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele gerektiğinde skill yönergelerini nasıl yükleyeceğini söyler.
- **OpenClaw Denetimi**: modele yapılandırma/yeniden başlatma işleri için
  `gateway` aracını tercih etmesini ve CLI komutları uydurmaktan kaçınmasını
  söyler.
- **OpenClaw Öz Güncelleme**: yapılandırmayı `config.schema.lookup` ile güvenli
  şekilde inceleme, yapılandırmayı `config.patch` ile yamama, tam yapılandırmayı
  `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı
  isteğinde çalıştırma biçimi. Yalnızca sahip `gateway` aracı, korunan bu exec
  yollarına normalize edilen eski `tools.bash.*` takma adları dahil
  `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı da
  reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw docs/source için yerel yol ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edilmiş)**: önyükleme dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: yalnızca saat dilimi (önbellek açısından kararlı; canlı saat `session_status` değerinden gelir).
- **Assistant Çıktı Direktifleri**: kompakt ek, sesli not ve yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan agent için Heartbeat'ler etkin olduğunda Heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: host, işletim sistemi, Node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning değiştirme ipucu.

OpenClaw, **Proje Bağlamı** dahil büyük kararlı içeriği dahili istem önbelleği
sınırının üstünde tutar. Denetim UI gömme yönlendirmesi, **Mesajlaşma**,
**Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeats** ve **Çalışma
Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece
ön ek önbellekleri olan yerel arka uçlar, kararlı çalışma alanı ön ekini kanal
turları arasında yeniden kullanabilir. Araç açıklamaları da kabul edilen şema
zaten bu çalışma zamanı ayrıntısını taşıdığında geçerli kanal adlarını gömmekten
kaçınmalıdır.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı yönlendirmesi içerir:

- gelecekteki takipler için (`check back later`, hatırlatıcılar, yinelenen işler)
  `exec` uyku döngüleri, `yieldMs` geciktirme hileleri veya yinelenen `process`
  yoklaması yerine Cron kullanın
- `exec` / `process` değerlerini yalnızca şimdi başlayan ve arka planda çalışmaya
  devam eden komutlar için kullanın
- otomatik tamamlama uyandırması etkin olduğunda komutu bir kez başlatın ve çıktı
  yaydığında veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya
  müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt-agent tamamlaması push
  tabanlıdır ve isteyene otomatik olarak geri duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list`
  komutlarını döngü içinde yoklamayın

`agents.defaults.subagents.delegationMode` bu yönlendirmeyi güçlendirebilir.
Varsayılan `suggest` modu temel dürtmeyi korur. `prefer`, ana agente duyarlı bir
koordinatör gibi davranmasını ve doğrudan yanıttan daha kapsamlı her şeyi
`sessions_spawn` üzerinden iletmesini söyleyen özel bir **Alt-Agent Yetki Devri**
bölümü ekler. Bu yalnızca istem düzeyindedir; `sessions_spawn` değerinin mevcut
olup olmadığını araç politikası kontrol etmeye devam eder.

Deneysel `update_plan` aracı etkin olduğunda Araçlar, modele bunu yalnızca
önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan
kaçınmasını da söyler.

Sistem istemindeki güvenlik korumaları tavsiye niteliğindedir. Model davranışını yönlendirir ancak politikayı zorla uygulatmaz. Sert uygulama için araç politikası, exec onayları, sandboxing ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık agente
önce bu yerel onay UI'sına güvenmesini söyler. Manuel `/approve` komutunu
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek
yol olduğunu söylediğinde dahil etmelidir.

## İstem modları

OpenClaw alt-agent'ler için daha küçük sistem istemleri işleyebilir. Çalışma
zamanı her çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir
yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt-agent'ler için kullanılır; **Bellek Geri Çağırma**, **OpenClaw
  Öz Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Assistant Çıktı Direktifleri**,
  **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeats** bölümlerini atlar.
  Araçlar, **Güvenlik**, sağlandığında **Skills**, Çalışma Alanı, Sandbox,
  Geçerli Tarih ve Saat (bilindiğinde), Çalışma Zamanı ve enjekte edilmiş bağlam
  kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilmiş istemler **Grup Sohbeti
Bağlamı** yerine **Alt-Agent Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmaları için OpenClaw, doğrudan/grup sohbet bağlamı
zaten çözülmüş konuşmaya özgü `NO_REPLY` davranışını içerdiğinde genel **Sessiz
Yanıtlar** bölümünü atlayabilir. Bu, token mekaniklerini hem global sistem
isteminde hem de kanal bağlamında tekrarlamayı önler.

## İstem anlık görüntüleri

OpenClaw, Codex çalışma zamanı mutlu yoluna ait kayıtlı istem anlık
görüntülerini `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`
altında tutar. Bunlar, seçili app-server thread/turn parametrelerini ve Telegram
doğrudan, Discord grup ve Heartbeat turları için yeniden oluşturulmuş modele
bağlı istem katmanı yığınını işler. Bu yığın, Codex'in model kataloğu/önbellek
şeklinden oluşturulmuş sabitlenmiş bir Codex `gpt-5.5` model istem fikstürünü,
Codex mutlu yol izin geliştirici metnini, OpenClaw geliştirici yönergelerini,
OpenClaw sağladığında tur kapsamlı işbirliği modu yönergelerini, kullanıcı tur
girdisini ve dinamik araç spesifikasyonlarına referansları içerir.

Sabitlenmiş Codex model istem fikstürünü
`pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak betik,
Codex'in çalışma zamanı önbelleğini önce `$CODEX_HOME/models_cache.json`, sonra
`~/.codex/models_cache.json` konumunda arar ve ancak bundan sonra
`~/code/codex/codex-rs/models-manager/models.json` konumundaki bakımcı Codex
checkout kuralına geri döner. Bu kaynakların hiçbiri yoksa komut, kayıtlı
fikstürü değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json`
dosyasından yenilemek için `--catalog <path>` geçirin.

Bu anlık görüntüler yine de bayt bayt ham OpenAI istek yakalaması değildir.
Codex, OpenClaw thread ve turn parametrelerini gönderdikten sonra Codex çalışma
zamanı içinde `AGENTS.md`, ortam bağlamı, anılar, app/plugin yönergeleri ve
yerleşik Default işbirliği modu yönergeleri gibi çalışma zamanına ait çalışma
alanı bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve sapmayı
`pnpm prompt:snapshots:check` ile doğrulayın. CI, istem değişiklikleri ile anlık
görüntü güncellemelerinin aynı PR'ye bağlı kalması için sapma kontrolünü ek sınır
parçasında çalıştırır.

## Çalışma alanı önyükleme enjeksiyonu

Önyükleme dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model, açık okumalara gerek duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcut olduğunda `MEMORY.md`

Bu dosyaların tümü, dosyaya özgü bir kapı uygulanmadığı sürece her turda
**bağlam penceresine enjekte edilir**. Varsayılan agent için Heartbeat'ler devre
dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false
olduğunda normal çalıştırmalarda `HEARTBEAT.md` atlanır. Enjekte edilen dosyaları,
özellikle `MEMORY.md` dosyasını kısa tutun. `MEMORY.md` düzenlenmiş uzun vadeli
bir özet olarak kalmak içindir; ayrıntılı günlük notlar, `memory_search` ve
`memory_get` araçlarının gerektiğinde alabileceği `memory/*.md` içine aittir.
Aşırı büyük `MEMORY.md` dosyaları istem kullanımını artırır ve aşağıdaki
önyükleme dosyası sınırları nedeniyle kısmen enjekte edilebilir.

Bir oturum yerel Codex harness üzerinde çalıştığında Codex, `AGENTS.md` dosyasını
kendi proje belgesi keşfi üzerinden yükler. OpenClaw kalan önyükleme dosyalarını
yine de çözümler ve bunları Codex yapılandırma yönergeleri olarak iletir; böylece
`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`
ve `MEMORY.md`, `AGENTS.md` dosyasını çoğaltmadan aynı çalışma alanı bağlamı
rolünü korur.

<Note>
`memory/*.md` günlük dosyaları normal önyükleme Proje Bağlamının parçası **değildir**. Sıradan turlarda `memory_search` ve `memory_get` araçları üzerinden gerektiğinde erişilirler; bu nedenle model onları açıkça okumadıkça bağlam penceresinden düşmezler. Yalın `/new` ve `/reset` turları istisnadır: çalışma zamanı, o ilk tur için son günlük belleği tek seferlik bir başlangıç bağlamı bloğu olarak başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretçiyle kısaltılır. Dosya başına azami boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan:
12000). Dosyalar genelinde enjekte edilen toplam önyükleme içeriği
`agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000).
Eksik dosyalar kısa bir eksik dosya işaretçisi enjekte eder. Kısaltma
gerçekleştiğinde OpenClaw kısa bir sistem istemi uyarı bildirimi enjekte
edebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` (`off`,
`once`, `always`; varsayılan: `once`) ile kontrol edin. Ayrıntılı ham/enjekte
edilmiş sayımlar `/context`, `/status`, doctor ve günlükler gibi tanılamalarda
kalır.

Bellek dosyaları için kısaltma veri kaybı değildir: dosya diskte sağlam kalır,
ancak model belleği doğrudan okuyana veya arayana kadar yalnızca kısaltılmış
enjekte edilmiş kopyayı görür. `MEMORY.md` tekrar tekrar kısaltılıyorsa onu daha
kısa kalıcı bir özete damıtın ve ayrıntılı geçmişi `memory/*.md` içine taşıyın
veya önyükleme sınırlarını bilinçli olarak yükseltin.

Alt-agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder
(diğer önyükleme dosyaları alt-agent bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, enjekte edilen önyükleme dosyalarını değiştirmek veya onların
yerine başka dosyalar koymak için (örneğin `SOUL.md` yerine alternatif bir
persona kullanmak) bu adımı `agent:bootstrap` üzerinden kesebilir.

Aracın daha az genel bir üsluba sahip olmasını istiyorsanız
[SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Eklenen her dosyanın ne kadar katkı sağladığını incelemek için (ham ve eklenmiş, kırpma, ayrıca araç şeması ek yükü) `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcının saat dilimi bilindiğinde sistem prompt'u özel bir **Geçerli Tarih ve Saat** bölümü içerir. Prompt önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi içermez).

Aracın geçerli saate ihtiyaç duyduğu durumlarda `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model geçersiz kılmasını da ayarlayabilir (`model=default` bunu temizler).

Şununla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Tarih ve Saat](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir Skills listesi** (`formatSkillsForPrompt`) ekler. Prompt, modele listelenen konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun Skills yoksa Skills bölümü atlanır.

Uygunluk; skill meta veri kapılarını, çalışma zamanı ortamı/yapılandırma denetimlerini ve `agents.defaults.skills` ya da `agents.list[].skills` yapılandırıldığında etkili aracı skill izin listesini içerir.

Plugin ile paketlenmiş Skills yalnızca sahibi olan Plugin etkinleştirildiğinde uygundur. Bu, araç Plugin'lerinin bu rehberliğin tamamını her araç açıklamasına doğrudan gömmeden daha derin işletim kılavuzları sunmasına olanak tanır.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını hâlâ mümkün kılarken temel prompt'u küçük tutar.

Skills listesi bütçesi Skills alt sistemi tarafından sahiplenilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Aracı başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/ekleme boyutlandırmasından ayrı tutar.

## Dokümantasyon

Sistem prompt'u bir **Dokümantasyon** bölümü içerir. Yerel dokümanlar kullanılabilir olduğunda, yerel OpenClaw dokümanlar dizinine işaret eder (bir Git checkout içinde `docs/` veya paketlenmiş npm paket dokümanları). Yerel dokümanlar kullanılamıyorsa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout'ları yerel kaynak kökünü açığa çıkarır, böylece aracı kodu doğrudan inceleyebilir. Paket kurulumları GitHub kaynak URL'sini içerir ve dokümanlar eksik veya güncelliğini yitirmiş olduğunda aracıya kaynağı orada gözden geçirmesini söyler. Prompt ayrıca herkese açık dokümanlar aynasını, topluluk Discord'unu ve Skills keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce dokümanlara başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorar). Yapılandırma özelinde ise ajanları tam alan düzeyi dokümanlar ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup`'a, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Aracı çalışma zamanı](/tr/concepts/agent)
- [Aracı çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
