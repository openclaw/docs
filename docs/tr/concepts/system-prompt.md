---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neler içerdiği ve nasıl oluşturulduğu
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-02T20:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw, her agent çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her agent çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, OpenClaw'a ait istemin tamamını değiştirmeden
önbellek duyarlı istem rehberliği katkısı yapabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- küçük bir adlandırılmış çekirdek bölüm kümesini değiştirmek (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte etmek
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte etmek

Model ailesine özgü ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu normal sağlayıcı davranışı için değil, uyumluluk veya gerçekten küresel istem
değişiklikleri için saklayın.

OpenAI GPT-5 ailesi katmanı çekirdek yürütme kuralını küçük tutar ve
persona kilitlenmesi, kısa çıktı, araç disiplini,
paralel arama, teslim edilebilir kapsamı, doğrulama, eksik bağlam ve
terminal aracı hijyeni için modele özgü rehberlik ekler.

## Yapı

İstem bilinçli olarak kompakttır ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış araç doğruluk kaynağı hatırlatıcısı ve çalışma zamanı araç kullanımı rehberliği.
- **Yürütme Eğilimi**: kompakt işi tamamlama rehberliği: uygulanabilir isteklerde
  aynı turda harekete geç, tamamlanana veya engellenene kadar devam et, zayıf araç
  sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışı davranışından veya denetimi atlatmaktan kaçınmaya yönelik kısa koruma hatırlatıcısı.
- **Skills** (mevcut olduğunda): modele Skills talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Kendini Güncelleme**: yapılandırmayı
  `config.schema.lookup` ile güvenle inceleme, yapılandırmayı `config.patch` ile yamama, tam
  yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca açık kullanıcı
  isteğiyle çalıştırma. Yalnızca sahip aracı olan `gateway`, korumalı exec yollarına normalleştirilen eski `tools.bash.*`
  takma adları dahil olmak üzere
  `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı da reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve ne zaman okunacakları.
- **Çalışma Alanı Dosyaları (enjekte edilir)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox çalışma zamanını, sandbox yollarını ve yükseltilmiş exec kullanılabilirliğini belirtir.
- **Geçerli Tarih ve Saat**: kullanıcının yerel saati, saat dilimi ve saat biçimi.
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi söz dizimi.
- **Heartbeat'ler**: varsayılan agent için Heartbeat'ler etkinleştirildiğinde Heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning açma kapama ipucu.

OpenClaw, **Proje Bağlamı** dahil büyük kararlı içeriği
dahili istem önbelleği sınırının üstünde tutar. Control UI gömme rehberliği,
**Mesajlaşma**, **Ses**, **Grup Sohbeti Bağlamı**,
**Tepkiler**, **Heartbeat'ler** ve **Çalışma Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir;
böylece önek önbelleklerine sahip yerel arka uçlar kararlı çalışma alanı önekini
kanal turları arasında yeniden kullanabilir. Araç açıklamaları da kabul edilen şema bu çalışma zamanı ayrıntısını zaten taşıyorsa geçerli
kanal adlarını gömmekten kaçınmalıdır.

Araçlar bölümü uzun süren işler için çalışma zamanı rehberliği de içerir:

- gelecekteki takip için (`check back later`, hatırlatıcılar, yinelenen iş)
  `exec` uyku döngüleri, `yieldMs` gecikme numaraları veya tekrarlanan `process`
  yoklaması yerine cron kullanın
- yalnızca şimdi başlayan ve arka planda çalışmaya devam eden komutlar için
  `exec` / `process` kullanın
- otomatik tamamlama uyandırması etkin olduğunda komutu bir kez başlatın ve çıktı yayımladığında veya başarısız olduğunda
  push tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için
  `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlaması
  push tabanlıdır ve istekte bulunana otomatik duyuru yapar
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını bir döngüde yoklamayın

Deneysel `update_plan` aracı etkinleştirildiğinde, Araçlar bölümü modele
bunu yalnızca önemsiz olmayan çok adımlı işler için kullanmasını, tam olarak bir
`in_progress` adımı tutmasını ve her güncellemeden sonra tüm planı yinelemekten kaçınmasını da söyler.

Sistem istemindeki güvenlik korumaları tavsiye niteliğindedir. Model davranışını yönlendirir ancak politika uygulamaz. Kesin yaptırım için araç politikası, exec onayları, sandbox kullanımı ve kanal izin listelerini kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık
agent'a önce bu yerel onay UI'sına güvenmesini söyler. Araç sonucu sohbet onaylarının kullanılamadığını veya
manuel onayın tek yol olduğunu söylediğinde yalnızca manuel bir
`/approve` komutu içermelidir.

## İstem modları

OpenClaw alt agent'lar için daha küçük sistem istemleri oluşturabilir. Çalışma zamanı her çalıştırma için bir
`promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent'lar için kullanılır; **Skills**, **Bellek Geri Çağırma**, **OpenClaw
  Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Yanıt Etiketleri**,
  **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeat'ler** bölümlerini atlar. Araçlar, **Güvenlik**,
  Çalışma Alanı, Sandbox, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilen
  bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, ek enjekte edilen istemler **Grup Sohbeti Bağlamı** yerine **Alt Agent
Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmaları için OpenClaw, doğrudan/grup sohbeti bağlamı çözümlenmiş
konuşmaya özgü `NO_REPLY` davranışını zaten içerdiğinde genel **Sessiz Yanıtlar**
bölümünü atlayabilir. Bu, token mekaniklerinin hem küresel sistem isteminde hem de kanal bağlamında
tekrarlanmasını önler.

## İstem anlık görüntüleri

OpenClaw, Codex/mesaj aracı çalışma zamanı için kaydedilmiş mutlu yol istem anlık görüntülerini
`test/fixtures/agents/prompt-snapshots/happy-path/` altında tutar. Bunlar
OpenClaw'a ait Codex app-server geliştirici talimatlarını, seçili thread
başlatma/sürdürme parametrelerini, tur kullanıcı girdisini ve Telegram doğrudan,
Discord grup ve Heartbeat turları için dinamik araç özelliklerini oluşturur. Gizli temel Codex sistem istemi ve
tur kapsamlı Codex iş birliği modu talimatları Codex çalışma zamanına aittir
ve OpenClaw tarafından oluşturulmaz.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve sapmayı
`pnpm prompt:snapshots:check` ile doğrulayın.

## Çalışma alanı bootstrap enjeksiyonu

Bootstrap dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model açık okumalar gerektirmeden kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- `MEMORY.md` mevcut olduğunda

Bu dosyaların tümü, dosyaya özgü bir kapı uygulanmadığı sürece her turda **bağlam penceresine enjekte edilir**.
Varsayılan agent için Heartbeat'ler devre dışı bırakıldığında veya
`agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda normal çalıştırmalarda `HEARTBEAT.md` atlanır.
Enjekte edilen dosyaları kısa tutun — özellikle zamanla büyüyebilen ve
beklenmedik derecede yüksek bağlam kullanımına ve daha sık Compaction'a yol açabilen `MEMORY.md`.

<Note>
`memory/*.md` günlük dosyaları normal bootstrap Proje Bağlamı'nın parçası **değildir**. Olağan turlarda bunlara `memory_search` ve `memory_get` araçları üzerinden gerektiğinde erişilir; bu nedenle model bunları açıkça okumadıkça bağlam penceresine dahil edilmezler. Çıplak `/new` ve `/reset` turları istisnadır: çalışma zamanı, o ilk tur için yakın tarihli günlük belleği tek kullanımlık bir başlangıç bağlamı bloğu olarak başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretçiyle kısaltılır. Dosya başına maksimum boyut
`agents.defaults.bootstrapMaxChars` tarafından kontrol edilir (varsayılan: 12000). Dosyalar genelindeki toplam enjekte edilen bootstrap
içeriği `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır
(varsayılan: 60000). Eksik dosyalar kısa bir eksik dosya işaretçisi enjekte eder. Kısaltma
oluştuğunda OpenClaw, Proje Bağlamı'na bir uyarı bloğu enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
varsayılan: `once`) ile denetleyin.

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (diğer bootstrap dosyaları
alt agent bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar bu adımı `agent:bootstrap` üzerinden keserek enjekte edilen bootstrap dosyalarını değiştirebilir veya
yerine yenilerini koyabilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Agent'ın daha az genel duyulmasını istiyorsanız
[SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Her enjekte edilen dosyanın ne kadar katkı yaptığını (ham ve enjekte edilmiş, kısaltma, ayrıca araç şeması ek yükü) incelemek için `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman yönetimi

Kullanıcı saat dilimi bilindiğinde sistem istemi özel bir **Geçerli Tarih ve Saat** bölümü içerir.
İstem önbelleğini kararlı tutmak için artık yalnızca
**saat dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Agent geçerli saate ihtiyaç duyduğunda `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına bir model
geçersiz kılması ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Tarih ve Saat](/tr/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren kompakt bir **kullanılabilir Skills listesi**
(`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen
konumdaki (çalışma alanı, yönetilen veya paketlenmiş) SKILL.md dosyasını yüklemek için `read`
kullanmasını söyler. Uygun Skills yoksa
Skills bölümü atlanır.

Uygunluk; skill meta veri kapılarını, çalışma zamanı ortamı/yapılandırma kontrollerini
ve `agents.defaults.skills` veya
`agents.list[].skills` yapılandırıldığında etkili agent skill izin listesini içerir.

Plugin ile paketlenmiş Skills yalnızca bunların sahibi olan Plugin etkin olduğunda uygundur.
Bu, araç Plugin'lerinin tüm bu rehberliği doğrudan her araç açıklamasına gömmeden daha derin işletim kılavuzları sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli Skills kullanımını mümkün kılarken temel istemi küçük tutar.

Skills listesi bütçesinin sahibi Skills alt sistemidir:

- Küresel varsayılan: `skills.limits.maxSkillsPromptChars`
- Agent başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlı çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi
çalışma zamanı okuma/enjeksiyon boyutlandırmasından ayrı tutar.

## Belgeler

Sistem istemi bir **Belgeler** bölümü içerir. Yerel belgeler mevcut olduğunda,
yerel OpenClaw belgeleri dizinine işaret eder (Git checkout içinde `docs/` veya paketlenmiş npm
paket belgeleri). Yerel belgeler kullanılamıyorsa
[https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout'ları yerel
kaynak kökünü sunar; böylece agent kodu doğrudan inceleyebilir. Paket kurulumları GitHub
kaynak URL'sini içerir ve belgeler eksik veya
eski olduğunda agent'a kaynağı orada incelemesini söyler. İstem ayrıca herkese açık belge yansısını, topluluk Discord'unu ve Skills keşfi için ClawHub'ı
([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için
önce belgelere başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını
(yalnızca erişimi yoksa kullanıcıya sormasını) söyler.
Özellikle yapılandırma için agent'ları kesin alan düzeyi belgeler ve kısıtlamalar için `gateway` aracı eylemi
`config.schema.lookup`'a, ardından daha geniş rehberlik için
`docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md`
dosyalarına yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
