---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyükleme veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neleri içerdiği ve nasıl bir araya getirildiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-04-30T09:19:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw her agent çalıştırması için özel bir sistem promptu oluşturur. Prompt **OpenClaw'a aittir** ve pi-coding-agent varsayılan promptunu kullanmaz.

Prompt, OpenClaw tarafından birleştirilir ve her agent çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, tam OpenClaw'a ait promptu değiştirmeden önbellek duyarlı prompt rehberliği katkısı sağlayabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış küçük bir çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- prompt önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- prompt önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özgü ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` prompt mutasyonunu normal sağlayıcı davranışı için değil, uyumluluk veya gerçekten global prompt değişiklikleri için saklayın.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona sabitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsamı, doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özgü rehberlik ekler.

## Yapı

Prompt bilinçli olarak kompakt tutulur ve sabit bölümler kullanır:

- **Araç Kullanımı**: yapılandırılmış araç doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı rehberliği.
- **Yürütme Eğilimi**: kompakt işi tamamlama rehberliği: eyleme geçirilebilir isteklerde aynı turda hareket etme, bitene veya engellenene kadar devam etme, zayıf araç sonuçlarından toparlanma, değişken durumu canlı kontrol etme ve sonlandırmadan önce doğrulama.
- **Güvenlik**: güç arama davranışından veya gözetimi atlatmaktan kaçınmaya yönelik kısa koruma hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele skill yönergelerini isteğe bağlı olarak nasıl yükleyeceğini söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı `config.schema.lookup` ile güvenli biçimde inceleme, yapılandırmayı `config.patch` ile yamama, tam yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı isteğinde çalıştırma. Yalnızca sahibin kullanabildiği `gateway` aracı ayrıca, korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil olmak üzere `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edildi)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkinken): sandbox çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcının yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi söz dizimi.
- **Heartbeats**: varsayılan agent için Heartbeat'ler etkinleştirildiğinde Heartbeat promptu ve onay davranışı.
- **Çalışma Zamanı**: ana makine, OS, node, model, repo kökü (algılandığında), düşünme seviyesi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük seviyesi + /reasoning değiştirme ipucu.

OpenClaw, **Proje Bağlamı** dahil büyük kararlı içeriği dahili prompt önbelleği sınırının üstünde tutar. Control UI gömme rehberliği, **Mesajlaşma**, **Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeats** ve **Çalışma Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece önek önbellekleri olan yerel arka uçlar, kanal turları arasında kararlı çalışma alanı önekini yeniden kullanabilir. Araç açıklamaları da kabul edilen şema bu çalışma zamanı ayrıntısını zaten taşıyorsa geçerli kanal adlarını gömmekten kaçınmalıdır.

Araç Kullanımı bölümü ayrıca uzun süren işler için çalışma zamanı rehberliği içerir:

- gelecekteki takip için (`check back later`, hatırlatıcılar, yinelenen işler) `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya yinelenen `process` yoklaması yerine Cron kullanın
- `exec` / `process` yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için kullanın
- otomatik tamamlanma uyandırması etkin olduğunda komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, giriş veya müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlanması push tabanlıdır ve istekte bulunana otomatik olarak geri duyurulur
- tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını döngü içinde yoklamayın

Deneysel `update_plan` aracı etkinken, Araç Kullanımı ayrıca modele bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmasını söyler.

Sistem promptundaki güvenlik korumaları tavsiye niteliğindedir. Model davranışını yönlendirir ancak ilke uygulamaz. Katı uygulama için araç ilkesi, exec onayları, sandbox ve kanal izin listeleri kullanın; operatörler tasarım gereği bunları devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda, çalışma zamanı promptu artık agent'a önce bu yerel onay UI'sına güvenmesini söyler. Yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.

## Prompt modları

OpenClaw, alt agent'lar için daha küçük sistem promptları oluşturabilir. Çalışma zamanı her çalıştırma için bir `promptMode` ayarlar (kullanıcıya yönelik bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent'lar için kullanılır; **Skills**, **Bellek Geri Çağırma**, **OpenClaw Kendi Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeats** bölümlerini atlar. Araç Kullanımı, **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilen bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilen promptlar **Grup Sohbeti Bağlamı** yerine **Alt Agent Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmaları için OpenClaw, doğrudan/grup sohbeti bağlamı çözümlenmiş konuşmaya özgü `NO_REPLY` davranışını zaten içerdiğinde genel **Sessiz Yanıtlar** bölümünü atlayabilir. Bu, token mekaniklerinin hem global sistem promptunda hem de kanal bağlamında tekrarlanmasını önler.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model açık okumalara gerek duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcut olduğunda `MEMORY.md`

Bu dosyaların tümü, dosyaya özgü bir kapı uygulanmadıkça her turda **bağlam penceresine enjekte edilir**. Varsayılan agent için Heartbeat'ler devre dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda normal çalıştırmalarda `HEARTBEAT.md` atlanır. Enjekte edilen dosyaları kısa tutun; özellikle zamanla büyüyebilen ve beklenmedik ölçüde yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md`.

<Note>
`memory/*.md` günlük dosyaları normal bootstrap Proje Bağlamı'nın parçası **değildir**. Olağan turlarda `memory_search` ve `memory_get` araçları aracılığıyla isteğe bağlı erişilirler; bu nedenle model bunları açıkça okumadıkça bağlam penceresine dahil edilmezler. Yalın `/new` ve `/reset` turları istisnadır: çalışma zamanı, o ilk tur için son günlük belleği tek seferlik bir başlangıç bağlamı bloğu olarak başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretleyiciyle kesilir. Dosya başına maksimum boyut `agents.defaults.bootstrapMaxChars` ile denetlenir (varsayılan: 12000). Dosyalar genelindeki toplam enjekte edilen bootstrap içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder. Kesme gerçekleştiğinde OpenClaw, Proje Bağlamı'na bir uyarı bloğu enjekte edebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` ile denetleyin (`off`, `once`, `always`; varsayılan: `once`).

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder (diğer bootstrap dosyaları alt agent bağlamını küçük tutmak için filtrelenir).

Dahili kancalar bu adımı `agent:bootstrap` aracılığıyla keserek enjekte edilen bootstrap dosyalarını değiştirebilir veya yerine başkalarını koyabilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Agent'ın daha az genel konuşmasını istiyorsanız [SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Enjekte edilen her dosyanın ne kadar katkıda bulunduğunu incelemek için (ham ve enjekte edilen, kesme, ayrıca araç şeması ek yükü) `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Sistem promptu, kullanıcı saat dilimi bilindiğinde özel bir **Geçerli Tarih ve Saat** bölümü içerir. Prompt önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi yok).

Agent'ın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına bir model geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Tarih ve Saat](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **mevcut skills listesi** (`formatSkillsForPrompt`) enjekte eder. Prompt, modele listelenen konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun skill yoksa Skills bölümü atlanır.

Uygunluk; skill meta veri kapılarını, çalışma zamanı ortam/yapılandırma denetimlerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkili agent skill izin listesini içerir.

Plugin ile paketlenmiş Skills yalnızca sahip Plugin etkin olduğunda uygundur. Bu, araç Plugin'lerinin bu rehberliğin tamamını her araç açıklamasına doğrudan gömmeden daha derin işletim kılavuzları sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını yine de mümkün kılarken temel promptu küçük tutar.

Skills listesi bütçesi Skills alt sistemine aittir:

- Global varsayılan: `skills.limits.maxSkillsPromptChars`
- Agent başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/enjeksiyon boyutlandırmasından ayrı tutar.

## Belgeler

Sistem promptu bir **Belgeler** bölümü içerir. Yerel belgeler mevcut olduğunda, yerel OpenClaw belgeleri dizinine işaret eder (Git checkout içindeki `docs/` veya paketlenmiş npm paketi belgeleri). Yerel belgeler kullanılamıyorsa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout'ları, agent'ın kodu doğrudan inceleyebilmesi için yerel kaynak kökünü sunar. Paket kurulumları GitHub kaynak URL'sini içerir ve agent'a belgeler eksik veya bayat olduğunda kaynağı orada incelemesini söyler. Prompt ayrıca herkese açık belgeler aynasını, topluluk Discord'unu ve Skills keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce belgelere başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorar). Özellikle yapılandırma için agent'ları kesin alan düzeyinde belgeler ve kısıtlamalar için `gateway` aracı eylemi `config.schema.lookup` yönlendirir; ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Agent çalışma zamanı](/tr/concepts/agent)
- [Agent çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
