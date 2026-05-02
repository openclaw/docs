---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neleri içerdiği ve nasıl bir araya getirildiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-02T23:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw, her agent çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her agent çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, OpenClaw'a ait istemin tamamını değiştirmeden önbellek uyumlu istem yönlendirmesi katkısı sağlayabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- küçük bir adlandırılmış çekirdek bölüm kümesini değiştirebilir (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte edebilir
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte edebilir

Model ailesine özel ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu uyumluluk veya gerçekten genel istem
değişiklikleri için tutun; normal sağlayıcı davranışı için değil.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona sabitleme, kısa çıktı, araç disiplini, paralel arama, teslim edilebilir kapsamı, doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özel yönlendirme ekler.

## Yapı

İstem kasıtlı olarak kompaktır ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araçlarda doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı yönlendirmesi.
- **Yürütme Eğilimi**: kısa takip yönlendirmesi: eyleme geçirilebilir isteklerde aynı tur içinde harekete geç, bitene veya engellenene kadar devam et, zayıf araç sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve sonlandırmadan önce doğrula.
- **Güvenlik**: güç arama davranışından veya gözetimi atlatmaktan kaçınmak için kısa koruma hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele Skills talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Kendi Kendini Güncelleme**: yapılandırmayı `config.schema.lookup` ile güvenli şekilde inceleme, `config.patch` ile yapılandırmaya yama yapma, tam yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı isteğiyle çalıştırma. Yalnızca sahibin kullanabildiği `gateway` aracı da korunan bu exec yollarına normalize olan eski `tools.bash.*` takma adları dahil olmak üzere `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw dokümanlarının yerel yolu (repo veya npm paketi) ve ne zaman okunacakları.
- **Çalışma Alanı Dosyaları (enjekte edilmiş)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: kullanıcının yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan agent için Heartbeat'ler etkin olduğunda Heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, OS, node, model, repo kökü (tespit edildiğinde), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

OpenClaw, **Proje Bağlamı** dahil büyük kararlı içeriği dahili istem önbelleği sınırının üstünde tutar. Control UI yerleştirme yönlendirmesi, **Mesajlaşma**, **Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeats** ve **Çalışma Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece önek önbellekleri olan yerel arka uçlar kanal turları arasında kararlı çalışma alanı önekini yeniden kullanabilir. Araç açıklamaları da kabul edilen şema bu çalışma zamanı ayrıntısını zaten taşıyorsa geçerli kanal adlarını gömmekten kaçınmalıdır.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı yönlendirmesi de içerir:

- gelecekteki takipler (`check back later`, hatırlatıcılar, yinelenen işler) için `exec` uyku döngüleri, `yieldMs` gecikme hileleri veya tekrarlanan `process` yoklaması yerine Cron kullanın
- `exec` / `process` yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için kullanın
- otomatik tamamlanma uyandırması etkin olduğunda komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, giriş veya müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlanması push tabanlıdır ve istekte bulunana otomatik olarak geri duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını döngü içinde yoklamayın

Deneysel `update_plan` aracı etkinleştirildiğinde, Araçlar ayrıca modele bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı tekrar etmekten kaçınmasını söyler.

Sistem istemindeki güvenlik korumaları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak politika uygulamazlar. Katı uygulama için araç politikası, exec onayları, sandbox ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık agent'a önce bu yerel onay UI'ına güvenmesini söyler. Araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde yalnızca manuel bir `/approve` komutu eklemelidir.

## İstem modları

OpenClaw, alt agent'lar için daha küçük sistem istemleri render edebilir. Çalışma zamanı her çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent'lar için kullanılır; **Skills**, **Bellek Geri Çağırma**, **OpenClaw Kendi Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeats** bölümlerini atlar. Araçlar, **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilmiş bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilmiş istemler **Grup Sohbeti Bağlamı** yerine **Alt Agent Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmaları için OpenClaw, doğrudan/grup sohbeti bağlamı konuşmaya özel çözümlenmiş `NO_REPLY` davranışını zaten içerdiğinde genel **Sessiz Yanıtlar** bölümünü atlayabilir. Bu, token mekaniğinin hem genel sistem isteminde hem de kanal bağlamında tekrar edilmesini önler.

## İstem anlık görüntüleri

OpenClaw, Codex çalışma zamanı mutlu yolu için commit'lenmiş istem anlık görüntülerini `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` altında tutar. Bunlar, seçili app-server thread/turn parametrelerini ve Telegram doğrudan, Discord grup ve Heartbeat turları için yeniden oluşturulmuş model bağlı istem katmanı yığınını render eder. Bu yığın, Codex'in model kataloğu/önbellek biçiminden üretilmiş sabitlenmiş bir Codex `gpt-5.5` model istem fikstürünü, Codex mutlu yol izin geliştirici metnini, OpenClaw geliştirici talimatlarını, kullanıcı tur girdisini ve dinamik araç spesifikasyonlarına referansları içerir.

Sabitlenmiş Codex model istem fikstürünü `pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak betik Codex'in çalışma zamanı önbelleğini önce `$CODEX_HOME/models_cache.json` konumunda, sonra `~/.codex/models_cache.json` konumunda arar ve ancak bundan sonra `~/code/codex/codex-rs/models-manager/models.json` konumundaki bakımcı Codex checkout geleneğine geri döner. Bu kaynakların hiçbiri yoksa komut commit'lenmiş fikstürü değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json` dosyasından yenilemek için `--catalog <path>` geçirin.

Bu anlık görüntüler hâlâ bayt bayt ham OpenAI istek yakalaması değildir. Codex, OpenClaw thread ve turn parametrelerini gönderdikten sonra Codex çalışma zamanı içinde `AGENTS.md`, ortam bağlamı, bellekler, app/Plugin talimatları ve gelecekteki iş birliği modu talimatları gibi çalışma zamanına ait çalışma alanı bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden üretin ve sapmayı `pnpm prompt:snapshots:check` ile doğrulayın. CI, ek sınır shard'ında sapma kontrolünü çalıştırır; böylece istem değişiklikleri ve anlık görüntü güncellemeleri aynı PR'a bağlı kalır.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları kırpılır ve modelin açık okumalar gerektirmeden kimlik ve profil bağlamını görmesi için **Proje Bağlamı** altına eklenir:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcut olduğunda `MEMORY.md`

Bu dosyaların tümü, dosyaya özel bir kapı uygulanmadığı sürece her turda **bağlam penceresine enjekte edilir**. Varsayılan agent için Heartbeat'ler devre dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda normal çalıştırmalarda `HEARTBEAT.md` atlanır. Enjekte edilen dosyaları kısa tutun; özellikle zamanla büyüyebilen ve beklenmedik şekilde yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md`.

Bir oturum yerel Codex harness'ında çalıştığında, Codex `AGENTS.md` dosyasını kendi proje dokümanı keşfi aracılığıyla yükler. OpenClaw yine de kalan bootstrap dosyalarını çözer ve Codex yapılandırma talimatları olarak iletir; böylece `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md`, `AGENTS.md` dosyasını çoğaltmadan aynı çalışma alanı bağlamı rolünü korur.

<Note>
`memory/*.md` günlük dosyaları normal bootstrap Proje Bağlamı'nın parçası **değildir**. Sıradan turlarda `memory_search` ve `memory_get` araçları aracılığıyla gerektiğinde erişilirler; bu nedenle model onları açıkça okumadıkça bağlam penceresine sayılmazlar. Yalın `/new` ve `/reset` turları istisnadır: çalışma zamanı, ilk tur için tek seferlik başlangıç bağlamı bloğu olarak son günlük belleği başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretleyiciyle kısaltılır. Dosya başına maksimum boyut `agents.defaults.bootstrapMaxChars` tarafından denetlenir (varsayılan: 12000). Dosyalar genelindeki toplam enjekte edilmiş bootstrap içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder. Kısaltma olduğunda OpenClaw, Proje Bağlamı'na bir uyarı bloğu enjekte edebilir; bunu `agents.defaults.bootstrapPromptTruncationWarning` ile denetleyin (`off`, `once`, `always`; varsayılan: `once`).

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder (alt agent bağlamını küçük tutmak için diğer bootstrap dosyaları filtrelenir).

Dahili hook'lar, enjekte edilen bootstrap dosyalarını değiştirmek veya tamamen yenisiyle değiştirmek için bu adımı `agent:bootstrap` aracılığıyla yakalayabilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Agent'ın daha az jenerik görünmesini istiyorsanız [SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Enjekte edilen her dosyanın ne kadar katkı sağladığını incelemek için (ham ve enjekte edilmiş, kısaltma, ayrıca araç şeması ek yükü) `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Sistem istemi, kullanıcı saat dilimi bilindiğinde özel bir **Geçerli Tarih ve Saat** bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi içermez).

Agent'ın geçerli saate ihtiyacı olduğunda `session_status` kullanın; durum kartı bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **mevcut Skills listesi** (`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen konumdaki (çalışma alanı, yönetilen veya paketle gelen) SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun Skills yoksa Skills bölümü atlanır.

Uygunluk; skill metadata kapılarını, çalışma zamanı ortamı/yapılandırma kontrollerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkin agent skill izin listesini içerir.

Plugin ile paketlenmiş Skills, yalnızca sahibi olan Plugin etkin olduğunda uygundur. Bu, araç Plugin'lerinin tüm bu yönlendirmeyi doğrudan her araç açıklamasına gömmeden daha derin işletim kılavuzları sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını hâlâ etkinleştirirken temel istemi küçük tutar.

Skills listesi bütçesi Skills alt sistemi tarafından yönetilir:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Agent başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlandırılmış çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/ekleme boyutlandırmasından ayrı tutar.

## Belgelendirme

Sistem istemi bir **Belgelendirme** bölümü içerir. Yerel belgeler kullanılabilir olduğunda, yerel OpenClaw belgeleri dizinine işaret eder (bir Git checkout içinde `docs/` veya paketlenmiş npm paketi belgeleri). Yerel belgeler kullanılamıyorsa [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout’ları, ajanın kodu doğrudan inceleyebilmesi için yerel kaynak kökünü sunar. Paket kurulumları GitHub kaynak URL’sini içerir ve belgeler eksik veya güncelliğini yitirmiş olduğunda ajana kaynağı orada incelemesini söyler. İstem ayrıca genel belgeler aynasını, topluluk Discord’unu ve Skills keşfi için ClawHub’ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce belgelere başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorar). Özellikle yapılandırma için, ajanları tam alan düzeyindeki belgeler ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup`’a, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
