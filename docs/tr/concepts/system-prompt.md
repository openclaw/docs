---
read_when:
    - Sistem istemi metnini, araçlar listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyüklemesini veya Skills enjeksiyonu davranışını değiştirme
summary: OpenClaw sistem isteminin neleri içerdiği ve nasıl bir araya getirildiği
title: Sistem istemi
x-i18n:
    generated_at: "2026-05-06T09:10:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw, her ajan çalıştırması için özel bir sistem istemi oluşturur. İstem **OpenClaw'a aittir** ve pi-coding-agent varsayılan istemini kullanmaz.

İstem OpenClaw tarafından birleştirilir ve her ajan çalıştırmasına enjekte edilir.

Sağlayıcı Plugin'leri, OpenClaw'a ait istemin tamamını değiştirmeden önbellek duyarlı istem rehberliği katkısı sağlayabilir. Sağlayıcı çalışma zamanı şunları yapabilir:

- küçük bir adlandırılmış çekirdek bölüm kümesini değiştirmek (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- istem önbelleği sınırının üstüne **kararlı bir önek** enjekte etmek
- istem önbelleği sınırının altına **dinamik bir sonek** enjekte etmek

Model ailesine özgü ayarlama için sağlayıcıya ait katkıları kullanın. Eski
`before_prompt_build` istem mutasyonunu normal sağlayıcı davranışı için değil,
uyumluluk veya gerçekten global istem değişiklikleri için saklayın.

OpenAI GPT-5 ailesi katmanı, çekirdek yürütme kuralını küçük tutar ve persona
sabitleme, özlü çıktı, araç disiplini, paralel arama, teslim edilebilir kapsam,
doğrulama, eksik bağlam ve terminal aracı hijyeni için modele özgü rehberlik ekler.

## Yapı

İstem kasıtlı olarak kompakt tutulur ve sabit bölümler kullanır:

- **Araçlar**: yapılandırılmış aracın doğruluk kaynağı olduğunu hatırlatma ve çalışma zamanı araç kullanımı rehberliği.
- **Yürütme Eğilimi**: kompakt tamamına erdirme rehberliği: eyleme dönüştürülebilir
  isteklerde aynı turda harekete geç, tamamlanana veya engellenene kadar devam et,
  zayıf araç sonuçlarından toparlan, değişebilir durumu canlı kontrol et ve
  sonlandırmadan önce doğrula.
- **Güvenlik**: güç arayışı davranışından veya gözetimi atlatmaktan kaçınmak için kısa güvenlik sınırı hatırlatması.
- **Skills** (mevcut olduğunda): modele skill talimatlarını gerektiğinde nasıl yükleyeceğini söyler.
- **OpenClaw Kendini Güncelleme**: yapılandırmayı
  `config.schema.lookup` ile güvenli biçimde inceleme, yapılandırmayı `config.patch`
  ile yamalama, tam yapılandırmayı `config.apply` ile değiştirme ve `update.run`
  komutunu yalnızca açık kullanıcı isteğiyle çalıştırma. Yalnızca sahip kullanımına
  açık `gateway` aracı ayrıca, korunan bu exec yollarına normalleştirilen eski
  `tools.bash.*` takma adları dahil olmak üzere `tools.exec.ask` /
  `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Dokümantasyon**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (enjekte edilen)**: başlangıç dosyalarının aşağıda yer aldığını belirtir.
- **Sandbox** (etkinken): sandbox'lı çalışma zamanını, sandbox yollarını ve yükseltilmiş exec'in kullanılabilir olup olmadığını belirtir.
- **Geçerli Tarih ve Saat**: yalnızca saat dilimi (önbellek kararlı; canlı saat `session_status` üzerinden gelir).
- **Yanıt Etiketleri**: desteklenen sağlayıcılar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: varsayılan ajan için Heartbeat'ler etkin olduğunda Heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, Node, model, repo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

OpenClaw, **Proje Bağlamı** dahil olmak üzere büyük kararlı içeriği dahili istem
önbelleği sınırının üstünde tutar. Control UI gömme rehberliği, **Mesajlaşma**,
**Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeats** ve **Çalışma
Zamanı** gibi değişken kanal/oturum bölümleri bu sınırın altına eklenir; böylece
önek önbelleklerine sahip yerel arka uçlar, kanal turları arasında kararlı çalışma
alanı önekini yeniden kullanabilir. Araç açıklamaları da, kabul edilen şema bu
çalışma zamanı ayrıntısını zaten taşıyorsa geçerli kanal adlarını gömmekten kaçınmalıdır.

Araçlar bölümü ayrıca uzun süren işler için çalışma zamanı rehberliği içerir:

- gelecekteki takipler (`check back later`, hatırlatıcılar, yinelenen işler) için
  `exec` uyku döngüleri, `yieldMs` geciktirme hileleri veya yinelenen `process`
  yoklaması yerine Cron kullan
- `exec` / `process` öğelerini yalnızca şimdi başlayan ve arka planda çalışmaya
  devam eden komutlar için kullan
- otomatik tamamlanma uyandırması etkin olduğunda komutu bir kez başlat ve çıktı
  yaydığında veya başarısız olduğunda push tabanlı uyandırma yoluna güven
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale
  için `process` kullan
- görev daha büyükse `sessions_spawn` tercih et; alt ajan tamamlanması push tabanlıdır
  ve istekte bulunana otomatik olarak geri duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını
  bir döngüde yoklama

Deneysel `update_plan` aracı etkinken, Araçlar ayrıca modele bunu yalnızca
basit olmayan çok adımlı işler için kullanmasını, tam olarak bir `in_progress`
adımı tutmasını ve her güncellemeden sonra tüm planı yinelemekten kaçınmasını söyler.

Sistem istemindeki güvenlik sınırları tavsiye niteliğindedir. Model davranışını
yönlendirir ancak ilkeyi zorla uygulatmaz. Sert yaptırım için araç ilkesi, exec
onayları, sandbox kullanımı ve kanal izin listelerini kullanın; operatörler bunları
tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı istemi artık ajana
önce bu yerel onay kullanıcı arayüzüne güvenmesini söyler. Yalnızca araç sonucu
sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde
manuel bir `/approve` komutu eklemelidir.

## İstem modları

OpenClaw, alt ajanlar için daha küçük sistem istemleri işleyebilir. Çalışma zamanı
her çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt ajanlar için kullanılır; **Skills**, **Bellek Geri Çağırma**,
  **OpenClaw Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**,
  **Yanıt Etiketleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeats**
  bölümlerini çıkarır. Araçlar, **Güvenlik**, Çalışma Alanı, Sandbox, Geçerli
  Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve enjekte edilen bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda ek enjekte edilen istemler **Grup Sohbeti Bağlamı**
yerine **Alt Ajan Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmalarında OpenClaw, doğrudan/grup sohbeti bağlamı
çözümlenmiş konuşmaya özgü `NO_REPLY` davranışını zaten içerdiğinde genel
**Sessiz Yanıtlar** bölümünü çıkarabilir. Bu, token mekaniklerinin hem global
sistem isteminde hem de kanal bağlamında yinelenmesini önler.

## İstem anlık görüntüleri

OpenClaw, Codex çalışma zamanı mutlu yol akışı için commit edilmiş istem anlık
görüntülerini `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`
altında tutar. Bunlar seçili app-server thread/turn parametrelerini ve Telegram
doğrudan, Discord grup ve Heartbeat turları için yeniden oluşturulmuş modele bağlı
istem katmanı yığınını işler. Bu yığın, Codex'in model katalog/önbellek şeklinden
oluşturulmuş sabitlenmiş bir Codex `gpt-5.5` model istemi fikstürü, Codex mutlu
yol izin geliştirici metni, OpenClaw geliştirici talimatları, OpenClaw sağladığında
tur kapsamlı işbirliği modu talimatları, kullanıcı tur girdisi ve dinamik araç
spesifikasyonlarına başvurular içerir.

Sabitlenmiş Codex model istemi fikstürünü
`pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak betik
Codex çalışma zamanı önbelleğini önce `$CODEX_HOME/models_cache.json`, sonra
`~/.codex/models_cache.json` konumunda arar ve ancak bundan sonra
`~/code/codex/codex-rs/models-manager/models.json` konumundaki maintainer Codex
checkout teamülüne geri döner. Bu kaynakların hiçbiri yoksa komut, commit edilmiş
fikstürü değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json`
dosyasından yenilemek için `--catalog <path>` geçirin.

Bu anlık görüntüler yine de bayt bayt ham OpenAI isteği yakalaması değildir. Codex,
OpenClaw thread ve turn parametrelerini gönderdikten sonra Codex çalışma zamanında
`AGENTS.md`, ortam bağlamı, bellekler, uygulama/Plugin talimatları ve yerleşik
Varsayılan işbirliği modu talimatları gibi çalışma zamanına ait çalışma alanı
bağlamı ekleyebilir.

Bunları `pnpm prompt:snapshots:gen` ile yeniden oluşturun ve kaymayı
`pnpm prompt:snapshots:check` ile doğrulayın. CI, ek sınır parçasında kayma
kontrolünü çalıştırır; böylece istem değişiklikleri ve anlık görüntü güncellemeleri
aynı PR'a bağlı kalır.

## Çalışma alanı başlangıç enjeksiyonu

Başlangıç dosyaları kırpılır ve **Proje Bağlamı** altında eklenir; böylece model
açık okumalara ihtiyaç duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcut olduğunda `MEMORY.md`

Bu dosyaların tümü, dosyaya özgü bir geçit uygulanmadıkça her turda **bağlam
penceresine enjekte edilir**. Varsayılan ajan için Heartbeat'ler devre dışıysa
veya `agents.defaults.heartbeat.includeSystemPromptSection` false ise normal
çalıştırmalarda `HEARTBEAT.md` çıkarılır. Enjekte edilen dosyaları kısa tutun;
özellikle zamanla büyüyebilen ve beklenmedik derecede yüksek bağlam kullanımına
ve daha sık Compaction'a yol açabilen `MEMORY.md` için.

Bir oturum yerel Codex harness üzerinde çalıştığında Codex, kendi proje belgesi
keşfi üzerinden `AGENTS.md` dosyasını yükler. OpenClaw yine de kalan başlangıç
dosyalarını çözer ve bunları Codex yapılandırma talimatları olarak iletir; böylece
`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`
ve `MEMORY.md`, `AGENTS.md` dosyasını çoğaltmadan aynı çalışma alanı bağlamı
rolünü korur.

<Note>
`memory/*.md` günlük dosyaları normal başlangıç Proje Bağlamının parçası **değildir**. Olağan turlarda bunlara `memory_search` ve `memory_get` araçları üzerinden gerektiğinde erişilir; bu nedenle model açıkça okumadıkça bağlam penceresine dahil edilmezler. Yalın `/new` ve `/reset` turları istisnadır: çalışma zamanı, o ilk tur için tek seferlik bir başlangıç bağlamı bloğu olarak son günlük belleği başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretleyiciyle kısaltılır. Dosya başına maksimum boyut
`agents.defaults.bootstrapMaxChars` tarafından denetlenir (varsayılan: 12000).
Dosyalar genelindeki toplam enjekte edilen başlangıç içeriği
`agents.defaults.bootstrapTotalMaxChars` tarafından sınırlandırılır (varsayılan:
60000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi enjekte eder. Kısaltma
olduğunda OpenClaw kısa bir sistem istemi uyarı bildirimi enjekte edebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile denetleyin (`off`, `once`,
`always`; varsayılan: `once`). Ayrıntılı ham/enjekte sayımları `/context`,
`/status`, doctor ve günlükler gibi tanılarda kalır.

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder
(diğer başlangıç dosyaları alt ajan bağlamını küçük tutmak için filtrelenir).

Dahili hook'lar, enjekte edilen başlangıç dosyalarını değiştirmek veya yerine
koymak için bu adımı `agent:bootstrap` üzerinden kesebilir (örneğin `SOUL.md`
yerine alternatif bir persona koymak).

Ajanın daha az genel konuşmasını istiyorsanız
[SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Her enjekte edilen dosyanın ne kadar katkı yaptığını (ham ve enjekte edilen,
kısaltma, ayrıca araç şeması ek yükü) incelemek için `/context list` veya
`/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman işleme

Kullanıcı saat dilimi bilindiğinde sistem istemi ayrılmış bir **Geçerli Tarih ve Saat**
bölümü içerir. İstem önbelleğini kararlı tutmak için artık yalnızca **saat dilimini**
içerir (dinamik saat veya zaman biçimi yoktur).

Ajanın geçerli zamana ihtiyacı olduğunda `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına bir
model geçersiz kılması ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için [Tarih ve Saat](/tr/date-time) bölümüne bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu** içeren
kompakt bir **mevcut Skills listesi** (`formatSkillsForPrompt`) enjekte eder.
İstem, modele listelenen konumdaki (çalışma alanı, yönetilen veya paketlenmiş)
SKILL.md dosyasını yüklemek için `read` kullanmasını söyler. Uygun skill yoksa
Skills bölümü çıkarılır.

Uygunluk; skill metadata geçitlerini, çalışma zamanı ortam/yapılandırma kontrollerini
ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında etkin
ajan skill izin listesini içerir.

Plugin ile paketlenen Skills yalnızca sahibi olan Plugin etkin olduğunda uygundur.
Bu, araç Plugin'lerinin tüm bu rehberliği doğrudan her araç açıklamasına gömmeden
daha derin işletim kılavuzları sunmasını sağlar.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, hedefli skill kullanımını hâlâ mümkün kılarken temel istemi küçük tutar.

Skills listesi bütçesi Skills alt sisteminin sorumluluğundadır:

- Genel varsayılan: `skills.limits.maxSkillsPromptChars`
- Ajan başına geçersiz kılma: `agents.list[].skillsLimits.maxSkillsPromptChars`

Genel sınırlandırılmış çalışma zamanı alıntıları farklı bir yüzey kullanır:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Bu ayrım, Skills boyutlandırmasını `memory_get`, canlı araç sonuçları ve Compaction sonrası AGENTS.md yenilemeleri gibi çalışma zamanı okuma/enjekte etme boyutlandırmasından ayrı tutar.

## Dokümantasyon

Sistem istemi bir **Dokümantasyon** bölümü içerir. Yerel belgeler mevcut olduğunda, yerel OpenClaw belgeleri dizinine işaret eder (bir Git checkout içindeki `docs/` veya paketlenmiş npm paketi belgeleri). Yerel belgeler mevcut değilse [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine geri döner.

Aynı bölüm OpenClaw kaynak konumunu da içerir. Git checkout'ları, ajanın kodu doğrudan inceleyebilmesi için yerel kaynak kökünü açığa çıkarır. Paket kurulumları GitHub kaynak URL'sini içerir ve belgeler eksik veya güncel olmadığında ajana kaynağı orada incelemesini söyler. İstem ayrıca herkese açık belge yansısını, topluluk Discord'unu ve Skills keşfi için ClawHub'ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Modele OpenClaw davranışı, komutları, yapılandırması veya mimarisi için önce belgelere başvurmasını ve mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler (yalnızca erişimi olmadığında kullanıcıya sorar). Özellikle yapılandırma için ajanları kesin alan düzeyi belgeler ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup`'a, ardından daha geniş rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` belgelerine yönlendirir.

## İlgili

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
