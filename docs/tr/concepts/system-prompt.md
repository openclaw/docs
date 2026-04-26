---
read_when:
    - Sistem istemi metnini, araç listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı bootstrap veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl oluşturulduğu
title: Sistem istemi
x-i18n:
    generated_at: "2026-04-26T11:27:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw, her ajan çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw sahipliğindedir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından bir araya getirilir ve her ajan çalıştırmasına enjekte edilir.

Sağlayıcı Plugins, tam OpenClaw sahipli istemi değiştirmeden önbellek farkında istem rehberliği ekleyebilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış birkaç küçük çekirdek bölümü değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üzerine **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Sağlayıcı sahipli katkıları model ailesine özgü ayarlamalar için kullanın. Eski
`before_prompt_build` istem mutasyonunu uyumluluk veya gerçekten genel istem
değişiklikleri için saklayın; normal sağlayıcı davranışı için değil.

OpenAI GPT-5 ailesi kaplaması, çekirdek yürütme kuralını küçük tutar ve persona
yakalama, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsam,
doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özgü rehberlik ekler.

## Yapı

İstem bilerek kompakt tutulur ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araçlar için doğruluk kaynağı hatırlatması ile çalışma zamanı araç kullanım rehberliği.
- **Yürütme Eğilimi**: uygulanabilir isteklerde tur içinde hareket etme, bitene ya da engellenene kadar devam etme, zayıf araç sonuçlarından kurtulma, değişebilir durumu canlı kontrol etme ve tamamlamadan önce doğrulama için kompakt yönlendirme.
- **Güvenlik**: güç arayışı davranışından veya gözetimi atlatmaktan kaçınmak için kısa korkuluk hatırlatması.
- **Skills** (varsa): modele ihtiyaç halinde skill yönergelerini nasıl yükleyeceğini söyler.
- **OpenClaw Self-Update**: yapılandırmayı `config.schema.lookup` ile güvenle inceleme, yapılandırmayı `config.patch` ile yamalama, tam yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı isteğinde çalıştırma. Sahip-özel `gateway` aracı ayrıca, bu korumalı exec yollarına normalize olan eski `tools.bash.*` diğer adları dahil `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edildi)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkinse): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcıya yerel saat, saat dilimi ve zaman biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan ajan için heartbeat etkin olduğunda heartbeat istemi ve ack davranışı.
- **Çalışma Zamanı**: host, işletim sistemi, Node, model, repo kökü (algılanırsa), düşünme düzeyi (tek satır).
- **Muhakeme**: geçerli görünürlük düzeyi + `/reasoning` geçiş ipucu.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı rehberliği de içerir:

- gelecekteki takip işi için Cron kullanın (`daha sonra tekrar kontrol et`, hatırlatmalar, yinelenen işler); `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlayan `process` yoklaması kullanmayın
- `exec` / `process` yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için kullanılmalıdır
- otomatik tamamlama uyandırması etkinse komutu bir kez başlatın ve çıktı yaydığında veya başarısız olduğunda itme tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemek için günlükler, durum, giriş veya müdahale gerektiğinde `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt ajan tamamlaması itme tabanlıdır ve istekte bulunana otomatik olarak duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` öğelerini döngü içinde yoklamayın

Deneysel `update_plan` aracı etkin olduğunda, Araçlar ayrıca modele bunu yalnızca trivial olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adım tutmasını ve her güncellemeden sonra tüm planı yinelememesini söyler.

Sistem istemindeki güvenlik korkulukları yönlendiricidir. Model davranışını yönlendirir ama ilkeyi zorla uygulatmaz. Zorlayıcı uygulama için araç ilkesi, exec onayları, sandboxing ve kanal izin listeleri kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık ajana önce bu yerel onay UI'sine güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylüyorsa manuel bir `/approve` komutu eklemelidir.

## İstem modları

OpenClaw alt ajanlar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies** ve **Heartbeats** bölümlerini atlar. Araçlar, **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilmiş bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda ek enjekte edilmiş istemler **Group Chat Context** yerine **Subagent Context** olarak etiketlenir.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları kırpılır ve **Project Context** altında eklenir; böylece model, açık okuma gerektirmeden kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`

Dosyaya özgü bir geçit uygulanmadığı sürece bu dosyaların tümü her turda **bağlam penceresine enjekte edilir**. `HEARTBEAT.md`, varsayılan ajan için heartbeat devre dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda normal çalıştırmalarda atlanır. Enjekte edilen dosyaları kısa tutun — özellikle zaman içinde büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları normal bootstrap Project Context'in parçası **değildir**. Sıradan turlarda bunlara `memory_search` ve `memory_get` araçlarıyla ihtiyaç halinde erişilir; böylece model bunları açıkça okumadıkça bağlam penceresini tüketmezler. Düz `/new` ve `/reset` turları istisnadır: çalışma zamanı ilk tur için son günlük belleği tek seferlik başlangıç bağlamı bloğu olarak öne ekleyebilir.

Büyük dosyalar bir işaretleyiciyle kırpılır. Dosya başına en yüksek boyut `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) tarafından denetlenir. Dosyalar arasında toplam enjekte edilen bootstrap içeriği `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile sınırlandırılır. Eksik dosyalar kısa bir eksik-dosya işaretleyicisi enjekte eder. Kırpma olduğunda OpenClaw, Project Context içinde bir uyarı bloğu enjekte edebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` ile denetleyin (`off`, `once`, `always`; varsayılan: `once`).

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (diğer bootstrap dosyaları, alt ajan bağlamını küçük tutmak için filtrelenir).

Dahili kancalar bu adımı `agent:bootstrap` üzerinden yakalayarak enjekte edilen bootstrap dosyalarını mutasyona uğratabilir veya değiştirebilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek gibi).

Ajanı daha az jenerik konuşturmak istiyorsanız [SOUL.md Kişilik Rehberi](/tr/concepts/soul) ile başlayın.

Enjekte edilen her dosyanın ne kadar katkıda bulunduğunu incelemek için (ham ve enjekte edilen, kırpma, ayrıca araç şeması ek yükü) `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Zaman işleme

Kullanıcının saat dilimi bilindiğinde sistem istemi özel bir **Geçerli Tarih ve Saat** bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya zaman biçimi yok).

Ajanın geçerli saate ihtiyaç duyduğunda `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şununla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her Skill için **dosya yolunu** içeren kompakt bir **uygun Skills listesi** (`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen konumdaki SKILL.md dosyasını yüklemek için `read` kullanmasını söyler (çalışma alanı, yönetilen veya paketlenmiş). Uygun Skill yoksa Skills bölümü atlanır.

Uygunluk; Skill meta veri geçitlerini, çalışma zamanı ortamı/yapılandırma kontrollerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkin ajan Skill izin listesini içerir.

Plugin ile paketlenmiş Skills yalnızca sahibi olan Plugin etkin olduğunda uygun olur. Bu, araç Plugin'lerinin her araç açıklamasına tüm rehberliği doğrudan gömmeden daha derin işletim rehberleri sunmasına olanak tanır.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, temel istemi küçük tutarken hedefli Skill kullanımını yine de etkinleştirir.

Skills listesi bütçesi Skills alt sistemine aittir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım; Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/enjeksiyon boyutlandırmasından ayrı tutar.

## Belgeler

Sistem istemi bir **Belgeler** bölümü içerir. Yerel belgeler mevcut olduğunda bu bölüm yerel OpenClaw belgeler dizinini işaret eder (bir Git checkout içindeki `docs/` veya paketlenmiş npm paket belgeleri). Yerel belgeler yoksa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm ayrıca OpenClaw kaynak konumunu da içerir. Git checkout'lar yerel kaynak kökünü açığa çıkarır; böylece ajan kodu doğrudan inceleyebilir. Paket kurulumları GitHub kaynak URL'sini içerir ve belgeler eksik veya eski olduğunda ajanı kaynağı orada incelemeye yönlendirir. İstem ayrıca herkese açık belge yansısını, topluluk Discord'unu ve Skill keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modeli, OpenClaw davranışı, komutlar, yapılandırma veya mimari için önce belgelere başvurması ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırması konusunda yönlendirir (yalnızca erişimi olmadığında kullanıcıya sorar). Özellikle yapılandırma için, ajanları tam alan düzeyi belgeler ve kısıtlar için `gateway` aracı eylemi `config.schema.lookup` yoluna, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Context engine](/tr/concepts/context-engine)
