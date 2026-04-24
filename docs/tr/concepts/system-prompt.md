---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı başlangıcını veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neleri içerdiği ve nasıl bir araya getirildiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-04-24T09:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw, her ajan çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından bir araya getirilir ve her ajan çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, OpenClaw'a ait tam istemi değiştirmeden
önbellek farkındalıklı istem yönlendirmesi ekleyebilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış az sayıdaki çekirdek bölümü değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Sağlayıcıya ait katkıları model ailesine özgü ince ayar için kullanın. Eski
`before_prompt_build` istem mutasyonunu uyumluluk veya gerçekten genel istem
değişiklikleri için koruyun; normal sağlayıcı davranışı için değil.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve
persona sabitleme, özlü çıktı, araç disiplini,
paralel arama, teslim edilebilir kapsamı, doğrulama, eksik bağlam ve
terminal aracı hijyeni için modele özgü yönlendirme ekler.

## Yapı

İstem kasıtlı olarak kompakt tutulur ve sabit bölümler kullanır:

- **Tooling**: yapılandırılmış araçlar için doğruluk kaynağı hatırlatması ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Execution Bias**: kompakt takip yönlendirmesi: uygulanabilir isteklere o turda
  harekete geç, bitene veya engellenene kadar devam et, zayıf araç
  sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve sonlandırmadan önce doğrula.
- **Safety**: güç arayan davranışlardan veya gözetimi aşmaktan kaçınmak için kısa bir koruma hatırlatması.
- **Skills** (mevcut olduğunda): modele isteğe bağlı olarak skill talimatlarını nasıl yükleyeceğini söyler.
- **OpenClaw Self-Update**: yapılandırmayı
  `config.schema.lookup` ile güvenle inceleme, yapılandırmayı `config.patch` ile yamalama,
  tam yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı
  isteğinde çalıştırma. Yalnızca sahip tarafından kullanılabilen `gateway` aracı ayrıca
  `tools.exec.ask` / `tools.exec.security` yeniden yazımını da reddeder; buna,
  korunan bu exec yollarına normalize edilen eski `tools.bash.*`
  takma adları da dahildir.
- **Workspace**: çalışma dizini (`agents.defaults.workspace`).
- **Documentation**: OpenClaw belgelerinin yerel yolu (depo veya npm paketi) ve bunların ne zaman okunacağı.
- **Workspace Files (injected)**: başlangıç dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox çalışma zamanını, sandbox yollarını ve yükseltilmiş exec kullanımının mevcut olup olmadığını belirtir.
- **Current Date & Time**: kullanıcıya yerel saat, saat dilimi ve saat biçimi.
- **Reply Tags**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan ajan için Heartbeat etkin olduğunda, Heartbeat istemi ve ack davranışı.
- **Runtime**: ana bilgisayar, OS, Node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Reasoning**: geçerli görünürlük düzeyi + `/reasoning` değiştirme ipucu.

Tooling bölümü ayrıca uzun süren işler için çalışma zamanı yönlendirmesi de içerir:

- `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrar eden `process`
  sorgulamaları yerine gelecekteki takip işleri (`sonra tekrar bak`, hatırlatmalar, yinelenen işler)
  için Cron kullan
- `exec` / `process` araçlarını yalnızca şimdi başlayan ve arka planda çalışmaya
  devam eden komutlar için kullan
- otomatik tamamlama uyandırması etkinse komutu bir kez başlat ve
  çıktı ürettiğinde veya başarısız olduğunda push tabanlı uyandırma yoluna güven
- çalışan bir komutu incelemek gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullan
- görev daha büyükse `sessions_spawn` tercih et; alt ajan tamamlanması push tabanlıdır ve istekte bulunana otomatik olarak bildirilir
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını döngü içinde sorgulama

Deneysel `update_plan` aracı etkin olduğunda Tooling ayrıca
modele bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı yinelememesini söyler.

Sistem istemindeki Safety korumaları yönlendiricidir. Model davranışını yönlendirirler ama ilke uygulamazlar. Kesin uygulama için araç ilkesi, exec onayları, sandboxing ve kanal izin listeleri kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık
ajana önce bu yerel onay UI'sine güvenmesini söyler. Yalnızca araç sonucu sohbet içi onayların kullanılamadığını veya tek yolun elle onay olduğunu söylediğinde
elle bir `/approve` komutu eklemelidir.

## İstem kipleri

OpenClaw alt ajanlar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her
çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** ve **Heartbeats** bölümlerini çıkarır. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (biliniyorsa), Runtime ve enjekte edilen
  bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda ek enjekte edilen istemler **Group Chat Context** yerine
**Subagent Context** olarak etiketlenir.

## Çalışma alanı başlangıç ekleme

Başlangıç dosyaları kırpılır ve **Project Context** altında eklenir; böylece model,
açık okuma yapmaya gerek kalmadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcutsa `MEMORY.md`

Dosyaya özgü bir geçit uygulanmadığı sürece bu dosyaların tümü her turda
**bağlam penceresine enjekte edilir**. Varsayılan ajan için Heartbeat devre dışıysa veya
`agents.defaults.heartbeat.includeSystemPromptSection` false ise normal çalıştırmalarda `HEARTBEAT.md`
atlanır. Enjekte edilen dosyaları kısa tutun —
özellikle zamanla büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımı ile daha sık Compaction'a yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları normal başlangıç
> Project Context parçası **değildir**. Sıradan turlarda bunlara
> `memory_search` ve `memory_get` araçlarıyla isteğe bağlı erişilir; bu nedenle model onları açıkça okumadıkça
> bağlam penceresine sayılmazlar. Sade `/new` ve
> `/reset` turları istisnadır: çalışma zamanı, ilk tur için tek seferlik bir başlangıç bağlamı bloğu olarak
> son günlük belleği öne ekleyebilir.

Büyük dosyalar bir işaretçiyle kırpılır. Dosya başına azami boyut
`agents.defaults.bootstrapMaxChars` ile kontrol edilir (varsayılan: 12000). Dosyalar arasında toplam enjekte edilen başlangıç
içeriği `agents.defaults.bootstrapTotalMaxChars`
ile sınırlandırılır (varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretçisi enjekte eder. Kırpma
olduğunda OpenClaw, Project Context içinde bir uyarı bloğu enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`).

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder (diğer başlangıç dosyaları
alt ajan bağlamını küçük tutmak için filtrelenir).

Internal hooks, enjekte edilen başlangıç dosyalarını değiştirmek veya tamamen değiştirmek için bu adımı `agent:bootstrap` üzerinden yakalayabilir
(örneğin `SOUL.md` yerine alternatif bir persona koymak gibi).

Ajanın daha az genel tınlamasını istiyorsanız
[SOUL.md Personality Guide](/tr/concepts/soul) ile başlayın.

Her enjekte edilen dosyanın ne kadar katkı yaptığını incelemek için (ham ve enjekte edilen, kırpma ve araç şeması ek yükü),
`/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi biliniyorsa sistem istemi özel bir **Current Date & Time** bölümü içerir.
İstem önbelleğini kararlı tutmak için artık yalnızca
**saat dilimini** içerir (dinamik saat veya saat biçimi yok).

Ajanın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model
geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şununla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Date & Time](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren
kompakt bir **mevcut skill listesi**
(`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen
konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun skill yoksa
Skills bölümü atlanır.

Uygunluk; skill meta veri geçitlerini, çalışma zamanı ortamı/yapılandırma denetimlerini
ve `agents.defaults.skills` veya
`agents.list[].skills` yapılandırıldığında etkin ajan skill izin listesini içerir.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedeflenmiş skill kullanımını etkin tutarken temel istemi küçük tutar.

Skills listesi bütçesi skills alt sistemi tarafından yönetilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi
çalışma zamanı okuma/ekleme boyutlandırmasından ayrı tutar.

## Documentation

Mevcut olduğunda sistem istemi, yerel
OpenClaw belgeler dizinine (repo çalışma alanındaki `docs/` veya paketlenmiş npm
paketi belgeleri) işaret eden bir **Documentation** bölümü içerir ve ayrıca herkese açık aynayı, kaynak depoyu, topluluk Discord'unu ve
skill keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. İstem, modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce yerel belgelere başvurmasını
ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını
(erişimi yoksa yalnızca o zaman kullanıcıya sormasını) söyler.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
