---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl oluşturulduğu
title: Sistem İstemi
x-i18n:
    generated_at: "2026-04-18T08:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e60705994cebdd9768926168cb1c6d17ab717d7ff02353a5d5e7478ba8191cab
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Sistem İstemi

OpenClaw, her ajan çalıştırması için özel bir sistem istemi oluşturur. Bu istem **OpenClaw tarafından sahiplenilir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem, OpenClaw tarafından oluşturulur ve her ajan çalıştırmasına eklenir.

Sağlayıcı Plugin'leri, OpenClaw’a ait tam istemi değiştirmeden önbellek farkındalığı olan istem yönlendirmeleri ekleyebilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış az sayıda çekirdek bölümü değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** ekleyebilir
- istem önbelleği sınırının altına **dinamik bir sonek** ekleyebilir

Model ailesine özgü ayarlar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu, normal sağlayıcı davranışı için değil, uyumluluk veya gerçekten genel istem değişiklikleri için saklayın.

## Yapı

İstem bilerek kompakt tutulur ve sabit bölümler kullanır:

- **Araç Kullanımı**: yapılandırılmış araçlar için tek gerçek kaynak hatırlatması ve çalışma zamanı araç kullanım yönlendirmesi.
- **Güvenlik**: güç arayışındaki davranışlardan veya gözetimi aşmaktan kaçınmak için kısa güvenlik önlemi hatırlatması.
- **Skills** (varsa): modele, skill talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı güvenli şekilde
  `config.schema.lookup` ile nasıl inceleyeceği, yapılandırmayı `config.patch` ile nasıl yamalayacağı, tüm
  yapılandırmayı `config.apply` ile nasıl değiştireceği ve `update.run` komutunu yalnızca açık kullanıcı
  isteğiyle nasıl çalıştıracağı. Yalnızca sahipler için olan `gateway` aracı ayrıca
  `tools.exec.ask` / `tools.exec.security` yollarını, bunlara normalize edilen eski `tools.bash.*`
  diğer adları dahil, yeniden yazmayı da reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (eklenmiş)**: önyükleme dosyalarının aşağıya dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec erişiminin kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcıya yerel saat, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi söz dizimi.
- **Heartbeat'ler**: varsayılan ajan için Heartbeat etkin olduğunda, Heartbeat istemi ve ack davranışı.
- **Çalışma Zamanı**: host, işletim sistemi, node, model, repo kökü (tespit edilirse), düşünme seviyesi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük seviyesi + /reasoning geçiş ipucu.

Araç Kullanımı bölümü, uzun süren işler için çalışma zamanı yönlendirmesini de içerir:

- gelecekteki takip işleri için (`daha sonra tekrar kontrol et`, anımsatıcılar, yinelenen işler) `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya yinelenen `process` yoklaması yerine cron kullanın
- `exec` / `process` araçlarını yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için kullanın
- otomatik tamamlanma uyanması etkin olduğunda, komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda push tabanlı uyanma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullanın
- görev daha büyükse, `sessions_spawn` tercih edin; alt ajan tamamlanması push tabanlıdır ve istekte bulunana otomatik olarak geri bildirilir
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını döngü içinde yoklamayın

Deneysel `update_plan` aracı etkin olduğunda, Araç Kullanımı bölümü modele ayrıca bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrar etmemesini söyler.

Sistem istemindeki güvenlik önlemleri tavsiye niteliğindedir. Model davranışını yönlendirir ancak politikayı zorla uygulamaz. Zorunlu uygulama için araç politikası, exec onayları, sandboxing ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda, çalışma zamanı istemi artık ajana önce bu yerel onay arayüzüne güvenmesini söyler. Yalnızca araç sonucu sohbet içi onayların kullanılamadığını veya tek yolun manuel onay olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.

## İstem modları

OpenClaw, alt ajanlar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir
`promptMode` ayarlar (kullanıcıya yönelik bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Bellek Geri Çağırma**, **OpenClaw
  Kendi Kendini Güncelleme**, **Model Diğer Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**,
  **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeat'ler** bölümlerini çıkarır. Araç Kullanımı, **Güvenlik**,
  Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve eklenmiş
  bağlam kullanılabilir olmaya devam eder.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilmiş istemler **Grup Sohbeti Bağlamı** yerine **Alt Ajan
Bağlamı** olarak etiketlenir.

## Çalışma alanı önyükleme ekleme

Önyükleme dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model açık okumalara ihtiyaç duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- varsa `MEMORY.md`, yoksa küçük harfli yedek olarak `memory.md`

Dosyaya özgü bir kapı uygulanmadıkça bu dosyaların tümü her turda **bağlam penceresine eklenir**.
Normal çalıştırmalarda, varsayılan ajan için Heartbeat devre dışıysa veya
`agents.defaults.heartbeat.includeSystemPromptSection` false ise `HEARTBEAT.md` çıkarılır. Eklenen
dosyaları kısa tutun — özellikle zamanla büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımına ve daha sık Compaction yapılmasına yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları normal önyükleme
> Proje Bağlamı'nın parçası **değildir**. Normal turlarda bunlara
> `memory_search` ve `memory_get` araçları aracılığıyla gerektiğinde erişilir; bu nedenle model bunları açıkça okumadıkça
> bağlam penceresini tüketmezler. Çıplak `/new` ve `/reset` turları istisnadır: çalışma zamanı ilk tur için
> tek seferlik bir başlangıç bağlamı bloğu olarak son günlük belleği başa ekleyebilir.

Büyük dosyalar bir işaretleyiciyle kırpılır. Dosya başına maksimum boyut
`agents.defaults.bootstrapMaxChars` ile kontrol edilir (varsayılan: 12000). Dosyalar arasında eklenen toplam önyükleme
içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır
(varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi ekler. Kırpma
olduğunda OpenClaw, Proje Bağlamı'na bir uyarı bloğu ekleyebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`).

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını ekler (diğer önyükleme dosyaları
alt ajan bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, eklenen önyükleme dosyalarını değiştirmek veya değiştirmek üzere bu adımı `agent:bootstrap` aracılığıyla kesebilir
(örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek gibi).

Ajanın daha az jenerik duyulmasını istiyorsanız,
[SOUL.md Personality Guide](/tr/concepts/soul) ile başlayın.

Her eklenen dosyanın ne kadar katkıda bulunduğunu incelemek için (ham ve eklenmiş, kırpma ve araç şeması ek yükü dahil), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi bilindiğinde sistem istemi özel bir **Geçerli Tarih ve Saat** bölümü içerir.
İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Ajanın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model
geçersiz kılma da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Date & Time](/tr/date-time).

## Skills

Uygun skill'ler bulunduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir skill listesi**
(`formatSkillsForPrompt`) ekler. İstem, modele listelenen
konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun skill yoksa
Skills bölümü çıkarılır.

Uygunluk; skill meta veri kapılarını, çalışma zamanı ortamı/yapılandırma kontrollerini
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

Bu, hedefli skill kullanımını etkinleştirirken temel istemi küçük tutar.

Skill listesi bütçesi Skills alt sistemi tarafından sahiplenilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, skill boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/ekleme boyutlandırmasından ayrı tutar.

## Belgeler

Mevcut olduğunda sistem istemi, yerel OpenClaw belgeler dizinine işaret eden bir **Belgeler** bölümü içerir
(repo çalışma alanındaki `docs/` veya paketlenmiş npm paketi belgeleri) ve ayrıca genel aynayı, kaynak repo'yu, topluluk Discord'unu ve
skill keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. İstem, modele OpenClaw davranışı, komutlar, yapılandırma veya mimari için önce yerel belgelere danışmasını
ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (erişimi yoksa yalnızca kullanıcıya sormasını).
