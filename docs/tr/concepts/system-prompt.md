---
read_when:
    - Sistem prompt metnini, araç listesini veya zaman/heartbeat bölümlerini düzenliyorsunuz
    - Çalışma alanı bootstrap’ini veya Skills ekleme davranışını değiştiriyorsunuz
summary: OpenClaw sistem prompt’unun neler içerdiği ve nasıl derlendiği
title: System Prompt
x-i18n:
    generated_at: "2026-04-05T13:52:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw, her agent çalıştırması için özel bir sistem prompt’u oluşturur. Bu prompt **OpenClaw’a aittir** ve pi-coding-agent varsayılan prompt’unu kullanmaz.

Prompt, OpenClaw tarafından derlenir ve her agent çalıştırmasına eklenir.

Provider plugin’leri, tam OpenClaw’a ait prompt’un yerini almadan
önbellek farkındalıklı prompt rehberliği katkısında bulunabilir. Provider çalışma zamanı şunları yapabilir:

- adlandırılmış az sayıda çekirdek bölümü (`interaction_style`,
  `tool_call_style`, `execution_bias`) değiştirebilir
- prompt önbelleği sınırının üstüne **kararlı bir önek** ekleyebilir
- prompt önbelleği sınırının altına **dinamik bir sonek** ekleyebilir

Provider’a ait katkıları model ailesine özgü ince ayarlar için kullanın. Eski
`before_prompt_build` prompt mutasyonunu uyumluluk veya gerçekten genel prompt
değişiklikleri için saklayın; normal provider davranışı için kullanmayın.

## Yapı

Prompt bilerek kompakt tutulur ve sabit bölümler kullanır:

- **Tooling**: yapılandırılmış araçlar için doğruluk kaynağı hatırlatması ve çalışma zamanında araç kullanım rehberliği.
- **Safety**: güç arayışlı davranıştan veya gözetimi aşmaktan kaçınmak için kısa bir koruma hatırlatması.
- **Skills** (mevcut olduğunda): modele gerektiğinde skill yönergelerini nasıl yükleyeceğini söyler.
- **OpenClaw Self-Update**: yapılandırmayı güvenli şekilde
  `config.schema.lookup` ile inceleme, yapılandırmayı `config.patch` ile yamalama, tüm
  yapılandırmayı `config.apply` ile değiştirme ve `update.run` komutunu yalnızca kullanıcı açıkça
  istediğinde çalıştırma. Yalnızca sahibin kullanabildiği `gateway` aracı ayrıca
  `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı da reddeder; bunlara
  bu korunan exec yollarına normalize edilen eski `tools.bash.*`
  takma adları da dahildir.
- **Workspace**: çalışma dizini (`agents.defaults.workspace`).
- **Documentation**: OpenClaw belgelerinin yerel yolu (repo veya npm paketi) ve ne zaman okunmaları gerektiği.
- **Workspace Files (injected)**: bootstrap dosyalarının aşağıda dahil edildiğini belirtir.
- **Sandbox** (etkin olduğunda): sandbox’lı çalışma zamanını, sandbox yollarını ve ayrıcalıklı exec kullanılabilirliğini belirtir.
- **Current Date & Time**: kullanıcı yerel saati, saat dilimi ve saat biçimi.
- **Reply Tags**: desteklenen provider’lar için isteğe bağlı yanıt etiketi sözdizimi.
- **Heartbeats**: heartbeat prompt’u ve ack davranışı.
- **Runtime**: ana makine, OS, node, model, repo kökü (algılanırsa), thinking düzeyi (tek satır).
- **Reasoning**: geçerli görünürlük düzeyi + /reasoning geçiş ipucu.

Tooling bölümü ayrıca uzun süren işler için çalışma zamanı rehberliği de içerir:

- gelecekte takip gerektiren işler (`daha sonra tekrar kontrol et`, hatırlatıcılar, yinelenen işler) için
  `exec` uyku döngüleri, `yieldMs` gecikme numaraları veya tekrarlanan `process`
  yoklaması yerine cron kullanın
- `exec` / `process` araçlarını yalnızca hemen başlayıp arka planda çalışmaya
  devam eden komutlar için kullanın
- otomatik tamamlanma uyandırması etkinse komutu bir kez başlatın ve çıktı ürettiğinde veya başarısız olduğunda
  itme tabanlı uyandırma yoluna güvenin
- çalışan bir komutu incelemeniz gerektiğinde günlükler, durum, girdi veya müdahale için `process` kullanın
- görev daha büyükse `sessions_spawn` tercih edin; alt agent tamamlanması
  itme tabanlıdır ve istekte bulunana otomatik duyurulur
- yalnızca tamamlanmayı beklemek için `subagents list` / `sessions_list` araçlarını döngü içinde yoklamayın

Deneysel `update_plan` aracı etkin olduğunda Tooling ayrıca modele şunları söyler:
onu yalnızca önemsiz olmayan çok adımlı işler için kullanmak, tam olarak bir
`in_progress` adımı tutmak ve her güncellemeden sonra tüm planı tekrarlamaktan kaçınmak.

Sistem prompt’undaki Safety korumaları tavsiye niteliğindedir. Model davranışını yönlendirirler ancak ilke zorlamazlar. Sert zorlamalar için araç ilkesi, exec onayları, sandbox ve kanal izin listeleri kullanın; operatörler bunları tasarım gereği devre dışı bırakabilir.

Yerel onay kartları/düğmeleri olan kanallarda çalışma zamanı prompt’u artık
agent’a önce bu yerel onay UI’sine güvenmesini söyler. Yalnızca araç sonucu sohbet içi onayların kullanılamadığını veya
tek yolun el ile onay olduğunu söylediğinde manuel bir
`/approve` komutu içermelidir.

## Prompt modları

OpenClaw, alt agent’lar için daha küçük sistem prompt’ları oluşturabilir. Çalışma zamanı her
çalıştırma için bir `promptMode` ayarlar (kullanıcıya dönük bir yapılandırma değildir):

- `full` (varsayılan): yukarıdaki tüm bölümleri içerir.
- `minimal`: alt agent’lar için kullanılır; **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** ve **Heartbeats** bölümlerini çıkarır. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (biliniyorsa), Runtime ve eklenmiş
  bağlam kullanılabilir kalır.
- `none`: yalnızca temel kimlik satırını döndürür.

`promptMode=minimal` olduğunda, eklenen ilave prompt’lar **Group Chat Context**
yerine **Subagent Context** etiketiyle gösterilir.

## Workspace bootstrap ekleme

Bootstrap dosyaları kırpılır ve **Project Context** altına eklenir; böylece model, açık okumalara ihtiyaç duymadan kimlik ve profil bağlamını görür:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca yepyeni çalışma alanlarında)
- mevcutsa `MEMORY.md`, aksi halde küçük harfli geri dönüş olarak `memory.md`

Bu dosyaların tümü her turda **bağlam penceresine eklenir**; bu da token tükettikleri anlamına gelir. Bunları kısa tutun — özellikle zamanla büyüyebilen ve beklenmedik şekilde yüksek bağlam kullanımına ve daha sık
compaction’a yol açabilen `MEMORY.md` dosyasını.

> **Not:** `memory/*.md` günlük dosyaları otomatik olarak **eklenmez**. Bunlara
> talep üzerine `memory_search` ve `memory_get` araçlarıyla erişilir; dolayısıyla model açıkça okumadıkça
> bağlam penceresinden pay almazlar.

Büyük dosyalar bir işaretleyiciyle kırpılır. Dosya başına en yüksek boyut
`agents.defaults.bootstrapMaxChars` ile kontrol edilir (varsayılan: 20000). Dosyalar genelinde eklenen toplam bootstrap
içeriği `agents.defaults.bootstrapTotalMaxChars`
ile sınırlandırılır (varsayılan: 150000). Eksik dosyalar kısa bir eksik dosya işaretleyicisi ekler. Kırpma
olduğunda OpenClaw, Project Context içine bir uyarı bloğu ekleyebilir; bunu
`agents.defaults.bootstrapPromptTruncationWarning` ile kontrol edin (`off`, `once`, `always`;
varsayılan: `once`).

Alt agent oturumları yalnızca `AGENTS.md` ve `TOOLS.md` dosyalarını ekler (diğer bootstrap dosyaları
alt agent bağlamını küçük tutmak için filtrelenir).

Internal hook’lar bu adıma `agent:bootstrap` üzerinden araya girerek
eklenen bootstrap dosyalarını değiştirebilir veya yerlerini alabilir (örneğin `SOUL.md` yerine alternatif bir persona yerleştirmek gibi).

Agent’ın daha az genel konuşmasını istiyorsanız başlangıç noktası olarak
[SOUL.md Personality Guide](/concepts/soul) belgesine bakın.

Eklenen her dosyanın ne kadar katkı yaptığını (ham ve eklenmiş boyut, kırpma ve araç şeması ek yükü dahil) incelemek için `/context list` veya `/context detail` kullanın. Bkz. [Context](/concepts/context).

## Zaman işleme

Sistem prompt’u, kullanıcı saat dilimi bilindiğinde özel bir **Current Date & Time** bölümü içerir. Prompt önbelleğini kararlı tutmak için artık yalnızca
**saat dilimini** içerir (dinamik saat veya saat biçimi yoktur).

Agent’ın güncel saati öğrenmesi gerektiğinde `session_status` kullanın; durum kartı
bir zaman damgası satırı içerir. Aynı araç isteğe bağlı olarak oturum başına model
geçersiz kılması da ayarlayabilir (`model=default` bunu temizler).

Şunlarla yapılandırın:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Tam davranış ayrıntıları için bkz. [Date & Time](/date-time).

## Skills

Uygun Skills mevcut olduğunda OpenClaw, her skill için **dosya yolunu**
içeren kompakt bir **kullanılabilir Skills listesi**
(`formatSkillsForPrompt`) ekler. Prompt, modele listelenen
konumdaki SKILL.md dosyasını yüklemek için `read` kullanmasını söyler (workspace, managed veya bundled). Uygun hiç skill yoksa
Skills bölümü çıkarılır.

Uygunluk; skill meta veri geçitlerini, çalışma zamanı ortamı/yapılandırma denetimlerini
ve `agents.defaults.skills` veya
`agents.list[].skills` yapılandırıldığında etkin agent skill izin listesini içerir.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Bu, temel prompt’u küçük tutarken yine de hedefli skill kullanımını mümkün kılar.

## Documentation

Mevcut olduğunda sistem prompt’u, yerel OpenClaw belgeler dizinine işaret eden bir **Documentation** bölümü içerir (repo workspace içindeki `docs/` veya paketlenmiş npm
paketi belgeleri) ve ayrıca herkese açık yansıyı, kaynak repo’yu, topluluk Discord’unu ve
Skills keşfi için ClawHub’ı ([https://clawhub.ai](https://clawhub.ai)) belirtir. Prompt, modele OpenClaw davranışı, komutlar, yapılandırma veya mimari için önce yerel belgelere bakmasını ve mümkün olduğunda
`openclaw status` komutunu kendisinin çalıştırmasını söyler (erişimi olmadığında yalnızca kullanıcıya sormalıdır).
