---
read_when:
    - Sistem istemi metnini, araç listesini veya zaman/Heartbeat bölümlerini düzenleme
    - Çalışma alanı önyükleme veya Skills ekleme davranışını değiştirme
summary: OpenClaw sistem isteminin içeriği ve nasıl oluşturulduğu
title: Sistem istemi
x-i18n:
    generated_at: "2026-07-12T12:16:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw her ajan çalıştırması için kendi sistem istemini oluşturur; çalışma zamanına ait varsayılan bir istem yoktur.

Birleştirme üç katmandan oluşur:

- `buildAgentSystemPrompt`, istemi açık girdilerden oluşturur. Saf bir oluşturucu olarak kalır ve genel yapılandırmayı doğrudan okumaz.
- `resolveAgentSystemPromptConfig`, belirli bir ajan için yapılandırmaya dayalı istem ayarlarını (sahip gösterimi, TTS ipuçları, model takma adları, bellek atıf modu, alt ajan yetkilendirme modu) çözümler.
- Çalışma zamanı bağdaştırıcıları (gömülü, CLI, komut/dışa aktarma önizlemeleri, Compaction) canlı bilgileri (araçlar, korumalı alan durumu, kanal yetenekleri, bağlam dosyaları, sağlayıcı istem katkıları) toplar ve yapılandırılmış istem cephesini çağırır.

Bu yaklaşım, her çalışma zamanı ayrıntısını tek parça devasa bir oluşturucuya dönüştürmeden dışa aktarılan/hata ayıklama istem yüzeylerini canlı çalıştırmalarla uyumlu tutar.

Sağlayıcı Plugin'leri, OpenClaw'a ait istemi değiştirmeden önbellek duyarlı yönlendirmeler ekleyebilir. Bir sağlayıcı çalışma zamanı şunları yapabilir:

- adlandırılmış üç temel bölümden birini değiştirebilir: `interaction_style`, `tool_call_style`, `execution_bias`
- istem önbelleği sınırının üzerine bir **kararlı önek** ekleyebilir
- istem önbelleği sınırının altına bir **dinamik sonek** ekleyebilir

Modele özgü ayarlamalar için sağlayıcıya ait katkıları kullanın. Eski `before_prompt_build` kancasını uyumluluk veya gerçekten genel istem değişiklikleri için ayırın.

Paketle gelen OpenAI/Codex GPT-5 ailesi katmanı (`resolveGpt5SystemPromptContribution`) bu mekanizmayı kullanır: bir `stablePrefix` davranış sözleşmesi (yürütme politikası, araç disiplini, çıktı sözleşmesi, tamamlama sözleşmesi) ve daha samimi bir üslup için isteğe bağlı bir `interaction_style` geçersiz kılması. OpenAI veya Codex Plugin'leri üzerinden yönlendirilen tüm `gpt-5*` model kimliklerine uygulanır ve `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` veya `"off"`) tarafından denetlenir.

## Yapı

İstem, sabit bölümlerle kısa ve özdür:

- **Araçlar**: yapılandırılmış araçların doğruluk kaynağı olduğuna ilişkin hatırlatma ve çalışma zamanı araç kullanımı yönlendirmesi. Deneysel `update_plan` aracı etkinleştirildiğinde (`tools.experimental.planTool`), kendi araç açıklaması şunları ekler: yalnızca basit olmayan, çok adımlı işler için kullanın; en fazla bir adımı `in_progress` durumunda tutun ve tek adımlı basit işler için kullanmayın.
- **Yürütme Eğilimi**: uygulanabilir istekleri aynı turda yerine getirin, tamamlanana veya engellenene kadar devam edin, yetersiz araç sonuçlarından sonra toparlanın, değişken durumu canlı olarak denetleyin ve sonlandırmadan önce doğrulayın.
- **Güvenlik**: güç elde etmeye yönelik davranışlara veya gözetimi aşmaya karşı kısa koruma hatırlatması.
- **Skills** (varsa): modele, Skills talimatlarını gerektiğinde nasıl yükleyeceğini bildirir.
- **OpenClaw Denetimi**: yapılandırma/yeniden başlatma işleri için `gateway` aracını tercih edin; CLI komutları uydurmayın.
- **OpenClaw Kendini Güncelleme**: yapılandırmayı `config.schema.lookup` ile güvenli biçimde inceleyin, `config.patch` ile yamalayın, yapılandırmanın tamamını `config.apply` ile değiştirin ve `update.run` komutunu yalnızca kullanıcının açık isteği üzerine çalıştırın. Ajana yönelik `gateway` aracı, korunan bu yollara normalleştirilen eski `tools.bash.*` takma adları dâhil olmak üzere `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder.
- **Çalışma Alanı**: çalışma dizini (`agents.defaults.workspace`).
- **Belgeler**: yerel belge/kaynak yolu ve bunların ne zaman okunacağı.
- **Çalışma Alanı Dosyaları (eklenen)**: başlangıç dosyalarının aşağıya eklendiğini belirtir.
- **Korumalı Alan** (etkinse): korumalı çalışma zamanı, korumalı alan yolları, yükseltilmiş yürütme kullanılabilirliği.
- **Geçerli Tarih ve Saat**: yalnızca saat dilimi (önbellek açısından kararlı; canlı saat `session_status` kaynağından gelir).
- **Asistan Çıktısı Yönergeleri**: kısa ek, sesli not ve yanıt etiketi söz dizimi.
- **Heartbeat'ler**: varsayılan ajan için Heartbeat'ler etkinleştirildiğinde Heartbeat istemi ve onay davranışı.
- **Çalışma Zamanı**: ana makine, işletim sistemi, Node, model, depo kökü (algılandığında), düşünme düzeyi (tek satır).
- **Akıl Yürütme**: geçerli görünürlük düzeyi ve `/reasoning` açma/kapatma ipucu.

Büyük ve kararlı içerik (**Proje Bağlamı** dâhil), dahili istem önbelleği sınırının üzerinde kalır. Tur başına değişken bölümler (Denetim Arayüzü gömme yönlendirmesi, **Mesajlaşma**, **Ses**, **Grup Sohbeti Bağlamı**, **Tepkiler**, **Heartbeat'ler**, **Çalışma Zamanı**) bu sınırın altına eklenir; böylece önek önbellekleri kullanan yerel arka uçlar, kararlı çalışma alanı önekini kanal turları arasında yeniden kullanabilir. Kabul edilen şema bu çalışma zamanı ayrıntısını zaten taşıyorsa araç açıklamaları geçerli kanal adlarını içermemelidir.

Araçlar bölümü ayrıca uzun süreli çalışma yönlendirmesi içerir:

- gelecekteki takipler (`check back later`, hatırlatmalar, yinelenen işler) için `exec` uyku döngüleri, `yieldMs` geciktirme yöntemleri veya yinelenen `process` yoklamaları yerine Cron kullanın
- yalnızca şimdi başlayan ve arka planda devam eden komutlar için `exec` / `process` kullanın
- otomatik tamamlanma uyandırması etkin olduğunda komutu bir kez başlatın ve anlık bildirim tabanlı uyandırma yoluna güvenin
- çalışan bir komutun günlükleri, durumu, girdisi veya komuta müdahale için `process` kullanın
- daha büyük görevlerde `sessions_spawn` tercih edin; alt ajanın tamamlanması anlık bildirim tabanlıdır ve istekte bulunan kişiye otomatik olarak duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` komutlarını bir döngü içinde yoklamayın

`agents.defaults.subagents.delegationMode` (varsayılan `"suggest"`) bunu güçlendirebilir. `"prefer"`, ana ajana duyarlı bir koordinatör olarak hareket etmesini ve doğrudan yanıttan daha kapsamlı olan her şeyi `sessions_spawn` üzerinden yönlendirmesini söyleyen özel bir **Alt Ajan Yetkilendirmesi** bölümü ekler. Bu yalnızca istem düzeyindedir; `sessions_spawn` aracının kullanılabilir olup olmadığını araç politikası belirlemeye devam eder.

Sistem istemindeki güvenlik korumaları yaptırım değil, tavsiye niteliğindedir. Kesin yaptırım için araç politikasını, yürütme onaylarını, korumalı alanı ve kanal izin listelerini kullanın; operatörler istem korumalarını tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri bulunan kanallarda istem, ajana önce bu kullanıcı arayüzüne güvenmesini ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu belirttiğinde manuel bir `/approve` komutu eklemesini söyler.

## İstem modları

OpenClaw, alt ajanlar için daha küçük sistem istemleri oluşturur. Çalışma zamanı, her çalıştırma için bir `promptMode` ayarlar (kullanıcıya yönelik bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümler.
- `minimal`: alt ajanlar için kullanılır; bellek istemi bölümünü (**Belleği Hatırlama** olarak paketlenir), **OpenClaw Kendini Güncelleme**, **Model Takma Adları**, **Kullanıcı Kimliği**, **Asistan Çıktısı Yönergeleri**, **Mesajlaşma**, **Sessiz Yanıtlar** ve **Heartbeat'ler** bölümlerini içermez. Araçlar, **Güvenlik**, **Skills** (sağlanmışsa), Çalışma Alanı, Korumalı Alan, Geçerli Tarih ve Saat (biliniyorsa), Çalışma Zamanı ve eklenen bağlam kullanılabilir durumda kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` altında, eklenen ilave istemler **Grup Sohbeti Bağlamı** yerine **Alt Ajan Bağlamı** olarak etiketlenir.

Kanal otomatik yanıt çalıştırmalarında OpenClaw; doğrudan, grup veya yalnızca mesaj aracı bağlamı görünür yanıt sözleşmesini zaten yönetiyorsa genel **Sessiz Yanıtlar** bölümünü içermez. Yalnızca eski otomatik grup/kanal modu `NO_REPLY` gösterir; doğrudan sohbetler ve yalnızca mesaj aracı yanıtları sessiz belirteç yönlendirmesini atlar.

## İstem anlık görüntüleri

OpenClaw, Codex çalışma zamanının sorunsuz yolu için işlenmiş istem anlık görüntülerini `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` altında tutar. Bunlar, Telegram doğrudan, Discord grup ve Heartbeat turları için seçili uygulama sunucusu iş parçacığı/tur parametrelerinin yanı sıra yeniden oluşturulmuş modele bağlı istem katmanı yığınını işler: sabitlenmiş bir Codex `gpt-5.5` model istemi fikstürü, Codex sorunsuz yol izin geliştirici metni, OpenClaw geliştirici talimatları, OpenClaw sağladığında tur kapsamlı iş birliği modu talimatları, kullanıcı turu girdisi ve dinamik araç belirtimlerine başvurular.

Sabitlenmiş Codex model istemi fikstürünü `pnpm prompt:snapshots:sync-codex-model` ile yenileyin. Varsayılan olarak önce `$CODEX_HOME/models_cache.json`, ardından `~/.codex/models_cache.json`, sonra da bakım sorumlusu çalışma kopyası geleneği olan `~/code/codex/codex-rs/models-manager/models.json` yolunu arar; hiçbiri yoksa işlenmiş fikstürü değiştirmeden çıkar. Belirli bir `models_cache.json` veya `models.json` dosyasından yenilemek için `--catalog <path>` geçirin.

Bu anlık görüntüler, ham OpenAI isteğinin bayt bayt birebir yakalaması değildir. Codex, OpenClaw iş parçacığı ve tur parametrelerini gönderdikten sonra çalışma zamanına ait çalışma alanı bağlamı (`AGENTS.md`, ortam bağlamı, bellekler, uygulama/Plugin talimatları, yerleşik Varsayılan iş birliği modu talimatları) ekleyebilir.

`pnpm prompt:snapshots:gen` ile yeniden oluşturun; sapmayı `pnpm prompt:snapshots:check` ile doğrulayın. CI, sapma denetimini ek sınır parçalarıyla birlikte çalıştırır; böylece istem değişiklikleri ve anlık görüntü güncellemeleri aynı PR'da yer alır.

## Çalışma alanı başlangıç eklemesi

Başlangıç dosyaları etkin çalışma alanından çözümlenir ve kullanım ömürleriyle eşleşen istem yüzeyine yönlendirilir:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcutsa `MEMORY.md`

Yerel Codex çalıştırma altyapısında OpenClaw, kararlı çalışma alanı dosyalarını her kullanıcı turunda yinelemekten kaçınır. Codex, `AGENTS.md` dosyasını kendi proje belgesi keşfi aracılığıyla yükler. `TOOLS.md`, devralınmış Codex geliştirici talimatları olarak iletilir. Yerel Codex alt ajanlarının bunları devralmaması için `SOUL.md`, `IDENTITY.md` ve `USER.md`, tur kapsamlı iş birliği geliştirici talimatları olarak iletilir. `HEARTBEAT.md` içeriği doğrudan eklenmez; dosya mevcutsa ve boş değilse Heartbeat turları dosyaya işaret eden bir iş birliği modu notu alır. `MEMORY.md` içeriği de her yerel Codex turuna yapıştırılmaz: çalışma alanı için bellek araçları kullanılabiliyorsa Codex turları, modeli `memory_search` veya `memory_get` aracına yönlendiren kısa bir çalışma alanı belleği notu alır. Araçlar devre dışıysa, bellek araması kullanılamıyorsa veya etkin çalışma alanı ajan belleği çalışma alanından farklıysa `MEMORY.md`, normal sınırlı tur bağlamı yoluna geri döner. `BOOTSTRAP.md`, normal tur bağlamı rolünü korur.

Codex dışı çalıştırma altyapılarında başlangıç dosyaları, mevcut koşullarına göre OpenClaw istemine eklenir. Varsayılan ajan için Heartbeat'ler devre dışı olduğunda veya `agents.defaults.heartbeat.includeSystemPromptSection` false olduğunda `HEARTBEAT.md` normal çalıştırmalarda içerilmez. Eklenen dosyaları, özellikle Codex dışı `MEMORY.md` dosyasını kısa tutun: ayrıntılı günlük notları gerektiğinde `memory_search` / `memory_get` aracılığıyla alınabilecek biçimde `memory/*.md` içinde bulunurken bu dosya, özenle düzenlenmiş uzun vadeli bir özet olarak kalmalıdır. Aşırı büyük Codex dışı `MEMORY.md` dosyaları istem kullanımını artırır ve aşağıdaki başlangıç dosyası sınırları kapsamında kısmen eklenebilir.

<Note>
`memory/*.md` günlük dosyaları normal başlangıç **Proje Bağlamı**nın parçası **değildir**. Olağan turlarda bunlara gerektiğinde `memory_search` / `memory_get` aracılığıyla erişilir; bu nedenle model açıkça okumadığı sürece bağlam penceresinde yer kaplamazlar. Yalın `/new` ve `/reset` turları istisnadır: çalışma zamanı, bu ilk tur için yakın tarihli günlük belleği tek seferlik bir başlangıç bağlamı bloğu olarak başa ekleyebilir.
</Note>

Büyük dosyalar bir işaretçiyle kısaltılır:

| Sınır                                        | Yapılandırma anahtarı                             | Varsayılan |
| -------------------------------------------- | ------------------------------------------------- | ---------- |
| Dosya başına azami karakter                  | `agents.defaults.bootstrapMaxChars`                | 20000      |
| Tüm dosyaların toplamı                       | `agents.defaults.bootstrapTotalMaxChars`           | 60000      |
| Kısaltma uyarısı (`off`\|`once`\|`always`)   | `agents.defaults.bootstrapPromptTruncationWarning` | `always`   |

Eksik dosyalar kısa bir eksik dosya işaretçisi ekler. Ayrıntılı ham/eklenmiş sayımlar `/context`, `/status`, doctor ve günlükler gibi tanılama yüzeylerinde kalır.

Bellek dosyalarında kısaltma, veri kaybı anlamına gelmez: dosya diskte olduğu gibi kalır. Yerel Codex'te `MEMORY.md`, kullanılabilir olduğunda bellek araçları aracılığıyla gerektiğinde okunur; aksi durumda sınırlı istem geri dönüşü kullanılır. Diğer çalıştırma altyapılarında model, belleği doğrudan okuyana veya arayana kadar yalnızca kısaltılmış eklenmiş kopyayı görür. `MEMORY.md` sürekli kısaltılıyorsa dosyayı daha kısa ve kalıcı bir özete dönüştürün, ayrıntılı geçmişi `memory/*.md` içine taşıyın veya başlangıç sınırlarını bilinçli olarak yükseltin.

Alt ajan oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını enjekte eder (alt ajan bağlamını küçük tutmak için diğer önyükleme dosyaları filtrelenir).

Dahili kancalar, enjekte edilen önyükleme dosyalarını değiştirmek veya başka dosyalarla değiştirmek için `agent:bootstrap` olayı üzerinden bu adımı yakalayabilir (örneğin `SOUL.md` dosyasını alternatif bir persona ile değiştirmek).

Daha az genel bir üslup için [SOUL.md Kişilik Kılavuzu](/tr/concepts/soul) ile başlayın.

Enjekte edilen her dosyanın katkı miktarını (ham ve enjekte edilmiş içerik, kırpma, araç şeması ek yükü) incelemek için `/context list` veya `/context detail` komutunu kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Zaman yönetimi

**Geçerli Tarih ve Saat** bölümü yalnızca kullanıcının saat dilimi bilindiğinde görünür ve istem önbelleğini kararlı tutmak için yalnızca **saat dilimini** içerir (dinamik saat veya saat biçimi içermez).

Ajan geçerli saate ihtiyaç duyduğunda `session_status` aracını kullanın; durum kartında zaman damgası satırı bulunur. Aynı araç isteğe bağlı olarak oturum başına model geçersiz kılması ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Davranışın tüm ayrıntıları için [Saat Dilimleri](/tr/concepts/timezone) ve [Tarih ve Saat](/tr/date-time) bölümlerine bakın.

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her Skill için **dosya yolu** ile içerikten türetilmiş bir `<version>sha256:...</version>` işaretçisi içeren kompakt bir `<available_skills>` listesi (`formatSkillsForPrompt`) enjekte eder. İstem, modele listelenen konumdaki SKILL.md dosyasını (çalışma alanındaki, yönetilen veya paketle birlikte gelen) yüklemek için `read` aracını kullanmasını ve `<version>` değeri önceki turdan farklı olduğunda Skill dosyasını yeniden okumasını söyler. Uygun Skills yoksa Skills bölümü atlanır.

Yerel Codex turları, zamanlanan istemi aynen koruyan hafif cron turları dışında, bu listeyi tur başına kullanıcı girdisi yerine tur kapsamlı iş birliği geliştirici talimatları olarak alır. Diğer çalıştırma çerçeveleri normal istem bölümünü korur.

Konum, `skills/personal/foo/SKILL.md` gibi iç içe geçmiş bir Skill dosyasına işaret edebilir. İç içe yerleşim yalnızca düzenleme amaçlıdır; istem, `SKILL.md` ön bilgilerindeki düz Skill adını kullanır.

Uygunluk; Skill meta verisi geçitlerini, çalışma zamanı ortamı/yapılandırma denetimlerini ve `agents.defaults.skills` veya `agents.list[].skills` yapılandırıldığında geçerli ajan Skill izin listesini kapsar. Plugin ile paketlenen Skills yalnızca sahibi olan Plugin etkinleştirildiğinde uygun olur; böylece araç Plugin'leri, tüm bu rehberliği her araç açıklamasına gömmeden daha ayrıntılı işletim kılavuzları sunabilir.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Bu, hedefli Skill kullanımını mümkün kılarken temel istemi küçük tutar. Boyutlandırma, genel çalışma zamanı okuma/enjeksiyon boyutlandırmasından ayrı olarak Skills alt sistemi tarafından yönetilir:

| Kapsam    | Skills istem bütçesi                              | Çalışma zamanı alıntı bütçesi     |
| --------- | ------------------------------------------------- | --------------------------------- |
| Genel     | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| Ajan başına | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

Çalışma zamanı alıntı bütçesi; `memory_get`, canlı araç sonuçları ve Compaction sonrası `AGENTS.md` yenilemelerini kapsar.

## Belgeler

**Belgeler** bölümü, mevcut olduğunda yerel belgelere (bir Git çalışma kopyasındaki `docs/` veya paketle birlikte gelen npm paketi belgeleri) işaret eder; aksi durumda [https://docs.openclaw.ai](https://docs.openclaw.ai) adresine başvurur. Ayrıca OpenClaw kaynak konumunu listeler: Git çalışma kopyaları yerel kaynak kökünü gösterirken paket kurulumları, belgeler eksik veya güncelliğini yitirmiş olduğunda kaynağın orada incelenmesi talimatıyla birlikte GitHub kaynak URL'sini gösterir.

İstem, model OpenClaw'ın nasıl çalıştığını (bellek/günlük notlar, oturumlar, araçlar, Gateway, yapılandırma, komutlar, proje bağlamı) anlamadan önce belgeleri OpenClaw hakkındaki öz bilginin yetkili kaynağı olarak tanımlar ve modele `AGENTS.md`, proje bağlamı, çalışma alanı/profil/bellek notları ile `memory_search` sonuçlarını OpenClaw tasarım/uygulama bilgisi yerine talimat bağlamı veya kullanıcı belleği olarak değerlendirmesini söyler. Belgeler bu konuda bilgi vermiyorsa veya güncelliğini yitirmişse model bunu belirtmeli ve kaynak kodunu incelemelidir. Ayrıca modele, erişimi olmadığında kullanıcıya sormak yerine mümkün olduğunda `openclaw status` komutunu kendisinin çalıştırmasını söyler.

Özellikle yapılandırma için ajanları, alan düzeyindeki kesin belgeler ve kısıtlamalar amacıyla `gateway` aracının `config.schema.lookup` eylemine; ardından daha kapsamlı rehberlik için `docs/gateway/configuration.md` ve `docs/gateway/configuration-reference.md` dosyalarına yönlendirir.

## İlgili konular

- [Ajan çalışma zamanı](/tr/concepts/agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Bağlam motoru](/tr/concepts/context-engine)
