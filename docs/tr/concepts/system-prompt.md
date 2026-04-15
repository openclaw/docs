---
read_when:
    - Sistem istemi metnini, araçlar listesini ya da zaman/heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl oluşturulduğu
title: Sistem İstemi
x-i18n:
    generated_at: "2026-04-15T19:41:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Sistem İstemi

OpenClaw, her ajan çalıştırması için özel bir sistem istemi oluşturur. Bu istem **OpenClaw tarafından sahiplenilir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem, OpenClaw tarafından oluşturulur ve her ajan çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, tam OpenClaw sahipli istemi değiştirmeden önbellek farkında istem yönlendirmesi sağlayabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış az sayıdaki çekirdek bölümü değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üzerine **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özgü ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu, normal sağlayıcı davranışı için değil,
uyumluluk veya gerçekten genel istem değişiklikleri için koruyun.

## Yapı

İstem bilinçli olarak kompakt tutulur ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araçlar için kaynak gerçeklik hatırlatması ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Güvenlik**: güç peşinde koşan davranışlardan veya denetimi atlamaktan kaçınmak için kısa koruma hatırlatması.
- **Skills** (mevcut olduğunda): modele, ihtiyaç halinde skill talimatlarını nasıl yükleyeceğini söyler.
- **OpenClaw Self-Update**: yapılandırmayı `config.schema.lookup` ile güvenli biçimde nasıl inceleyeceği, yapılandırmayı `config.patch` ile nasıl yamalayacağı, tam yapılandırmayı `config.apply` ile nasıl değiştireceği ve `update.run` komutunu yalnızca kullanıcı açıkça isterse nasıl çalıştıracağı. Yalnızca sahipte kullanılabilen `gateway` aracı ayrıca, korunan exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil olmak üzere `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Workspace**: çalışma dizini (`agents.defaults.workspace`).
- **Documentation**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve bunların ne zaman okunacağı.
- **Workspace Files (injected)**: önyükleme dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec kullanımının mevcut olup olmadığını belirtir.
- **Current Date & Time**: kullanıcı yerel saati, saat dilimi ve saat biçimi.
- **Reply Tags**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan ajan için heartbeat etkin olduğunda heartbeat istemi ve onay davranışı.
- **Runtime**: host, işletim sistemi, node, model, repo kökü (tespit edildiğinde), düşünme seviyesi (tek satır).
- **Reasoning**: geçerli görünürlük seviyesi + `/reasoning` geçiş ipucu.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı yönlendirmesi de içerir:

- gelecekteki takipler için (`daha sonra tekrar kontrol et`, hatırlatmalar, yinelenen işler) `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlanan `process` yoklaması yerine cron kullanın
- `exec` / `process` yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için kullanın
- otomatik tamamlanma uyandırması etkinse, komutu bir kez başlatın ve çıktı verdiğinde veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullanın
- görev daha büyükse, `sessions_spawn` tercih edin; alt ajan tamamlanması push tabanlıdır ve istekte bulunana otomatik olarak bildirilir
- yalnızca tamamlanmayı beklemek için döngü içinde `subagents list` / `sessions_list` yoklaması yapmayın

Deneysel `update_plan` aracı etkin olduğunda, Araçlar bölümü ayrıca modele bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını söyler.

Sistem istemindeki güvenlik korumaları yönlendiricidir. Model davranışına rehberlik ederler ancak politikayı zorunlu kılmazlar. Sıkı uygulama için araç politikasını, exec onaylarını, sandboxing'i ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda, çalışma zamanı istemi artık ajana önce bu yerel onay arayüzüne güvenmesini söyler. Yalnızca araç sonucu sohbet içi onayların kullanılamadığını veya tek yolun manuel onay olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.

## İstem kipleri

OpenClaw, alt ajanlar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir `promptMode` ayarlar (kullanıcıya açık bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies** ve **Heartbeats** bölümlerini çıkarır. Araçlar, **Güvenlik**, Workspace, Sandbox, Current Date & Time (biliniyorsa), Runtime ve enjekte edilen bağlam kullanılabilir olmaya devam eder.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, fazladan enjekte edilen istemler **Group Chat Context** yerine **Subagent Context** olarak etiketlenir.

## Workspace önyükleme ekleme işlemi

Önyükleme dosyaları kırpılır ve **Project Context** altında eklenir; böylece model, açıkça okuma gerektirmeden kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`, yoksa küçük harfli yedek olarak `memory.md`

Bu dosyaların tümü, dosyaya özel bir geçit uygulanmadığı sürece, her turda **bağlam penceresine enjekte edilir**. `HEARTBEAT.md`, varsayılan ajan için heartbeat devre dışıysa veya `agents.defaults.heartbeat.includeSystemPromptSection` false ise normal çalıştırmalarda çıkarılır. Enjekte edilen dosyaları kısa tutun — özellikle zaman içinde büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımına ve daha sık Compaction işlemine yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları, normal önyükleme
> Project Context parçası **değildir**. Normal turlarda bunlara
> `memory_search` ve `memory_get` araçları aracılığıyla ihtiyaç üzerine erişilir; bu nedenle model bunları açıkça okumadıkça
> bağlam penceresinden pay almazlar. Çıplak `/new` ve
> `/reset` turları istisnadır: çalışma zamanı ilk tur için
> yakın tarihli günlük belleği tek seferlik bir başlangıç bağlamı bloğu olarak öne ekleyebilir.

Büyük dosyalar bir işaretleyici ile kesilir. Dosya başına maksimum boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 20000). Dosyalar genelinde enjekte edilen toplam önyükleme içeriği
`agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır
(varsayılan: 150000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder. Kesilme olduğunda, OpenClaw Project Context içinde bir uyarı bloğu enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`).

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (alt ajan bağlamını küçük tutmak için diğer önyükleme dosyaları filtrelenir).

Dahili hook'lar bu adımı `agent:bootstrap` üzerinden yakalayarak enjekte edilen önyükleme dosyalarını değiştirebilir veya değiştirilmiş sürümleriyle değiştirebilir (örneğin `SOUL.md` yerine alternatif bir persona kullanmak gibi).

Ajanın daha az genel duyulmasını istiyorsanız,
[SOUL.md Personality Guide](/tr/concepts/soul) ile başlayın.

Her enjekte edilen dosyanın ne kadar katkıda bulunduğunu (ham ve enjekte edilen, kesilme, ayrıca araç şeması ek yükü) incelemek için `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Zaman işleme

Sistem istemi, kullanıcı saat dilimi bilindiğinde özel bir **Current Date & Time** bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Ajanın geçerli saati bilmesi gerektiğinde `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model geçersiz kılma da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Date & Time](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda, OpenClaw her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir skills listesi** (`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen konumdaki SKILL.md dosyasını yüklemek için `read` kullanmasını söyler (workspace, yönetilen veya paketlenmiş). Uygun skill yoksa Skills bölümü çıkarılır.

Uygunluk; skill meta veri geçitlerini, çalışma zamanı ortamı/yapılandırma kontrollerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkin ajan skill izin listesini içerir.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, temel istemi küçük tutarken hedefli skill kullanımını yine de mümkün kılar.

Skills listesi bütçesi Skills alt sistemi tarafından yönetilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/ekleme boyutlandırmasından ayrı tutar.

## Belgeler

Mevcut olduğunda, sistem istemi yerel OpenClaw belge dizinine işaret eden bir **Documentation** bölümü içerir (repo çalışma alanındaki `docs/` veya paketlenmiş npm paketi belgeleri) ve ayrıca genel aynayı, kaynak repoyu, topluluk Discord sunucusunu ve Skills keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. İstem, modele OpenClaw davranışı, komutlar, yapılandırma veya mimari için önce yerel belgelere başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını (erişimi yoksa yalnızca kullanıcıya sormasını) söyler.
