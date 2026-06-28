---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarının yazılacağını bilmek istiyorsunuz
summary: OpenClaw oturumlar arasında bilgileri nasıl hatırlar
title: Belleğe genel bakış
x-i18n:
    generated_at: "2026-06-28T00:28:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw, ajanınızın çalışma alanına **düz Markdown dosyaları** yazarak bazı şeyleri hatırlar. Model yalnızca diske kaydedilenleri "hatırlar"; gizli durum yoktur.

## Nasıl çalışır?

Ajanınızda bellekle ilgili üç dosya bulunur:

- **`MEMORY.md`** — uzun süreli bellek. Kalıcı gerçekler, tercihler ve kararlar. Her DM oturumunun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** (veya **`memory/YYYY-MM-DD-<slug>.md`**) — günlük notlar. Çalışan bağlam ve gözlemler. Bugünün ve dünün notları otomatik olarak yüklenir; `/new` veya `/reset` üzerinde paketle gelen oturum belleği hook'u tarafından yazılanlar gibi slug'lı varyantlar artık yalnızca tarih içeren dosyanın yanında alınır.
- **`DREAMS.md`** (isteğe bağlı) — insan incelemesi için Dream Günlüğü ve Dreaming taraması özetleri; temellendirilmiş geçmiş geri doldurma girdileri dahil.

Bu dosyalar ajan çalışma alanında bulunur (varsayılan `~/.openclaw/workspace`).

## Ne nereye gider?

`MEMORY.md` kompakt, seçilmiş katmandır. Ana özel oturumun başında kullanılabilir olması gereken kalıcı gerçekler, tercihler, devam eden kararlar ve kısa özetler için kullanın. Ham bir transkript, günlük kayıt veya kapsamlı arşiv olması amaçlanmaz.

`memory/YYYY-MM-DD.md` dosyaları çalışma katmanıdır. Ayrıntılı günlük notlar, gözlemler, oturum özetleri ve daha sonra hâlâ yararlı olabilecek ham bağlam için kullanın. Bu dosyalar `memory_search` ve `memory_get` için indekslenir, ancak her turda normal başlangıç istemine enjekte edilmez.

Zaman içinde ajanın, günlük notlardaki yararlı malzemeyi `MEMORY.md` içine damıtması ve bayat uzun süreli girdileri kaldırması beklenir. Oluşturulan çalışma alanı talimatları ve Heartbeat akışı bunu periyodik olarak yapabilir; hatırlanan her ayrıntı için `MEMORY.md` dosyasını elle düzenlemeniz gerekmez.

`MEMORY.md` başlangıç dosyası bütçesini aşarsa OpenClaw dosyayı diskte olduğu gibi tutar, ancak model bağlamına enjekte edilen kopyayı keser. Bunu, ayrıntılı malzemeyi yeniden `memory/*.md` içine taşımanız, `MEMORY.md` içinde yalnızca kalıcı özeti tutmanız veya açıkça daha fazla istem bütçesi harcamak istiyorsanız başlangıç sınırlarını yükseltmeniz için bir sinyal olarak değerlendirin. Ham ve enjekte edilen boyutları ve kesilme durumunu görmek için `/context list`, `/context detail` veya `openclaw doctor` kullanın.

<Tip>
Ajanınızın bir şeyi hatırlamasını istiyorsanız, sadece isteyin: "TypeScript tercih ettiğimi hatırla." Bunu uygun dosyaya yazacaktır.
</Tip>

## Eyleme duyarlı bellekler

Çoğu bellek sıradan Markdown notları olarak yazılabilir. Ancak bazı bellekler ajanın daha sonra ne yapması gerektiğini etkiler. Bunlar için yalnızca gerçeğin kendisini değil, not üzerinde ne zaman eyleme geçmenin güvenli olduğunu da yakalayın.

Bir not şunları içerdiğinde bu eylem sınırını yakalayın:

- onay veya izin gereksinimleri,
- geçici kısıtlamalar,
- başka bir oturuma, konuya veya kişiye devretmeler,
- sona erme koşulları,
- eyleme geçmenin güvenli olduğu zamanlama,
- kaynak veya sahip yetkisi,
- cazip bir eylemden kaçınma talimatları.

Yararlı bir eyleme duyarlı bellek şunları netleştirir:

- gelecekteki davranışı neyin değiştirdiği,
- ne zaman veya hangi koşul altında geçerli olduğu,
- ne zaman sona erdiği veya eylemi neyin kilidini açtığı,
- ajanın ne yapmaktan kaçınması gerektiği,
- güveni veya yetkiyi etkiliyorsa kaynağın veya sahibin kim olduğu.

Bellek onay bağlamını koruyabilir, ancak politika uygulamaz. Kesin operasyonel kontroller için OpenClaw onay ayarlarını, sandboxing'i ve zamanlanmış görevleri kullanın.

Örnek:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Başka bir örnek:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Çıkarımsal, kısa ömürlü takipler için [commitments](/tr/concepts/commitments) kullanın. Kesin hatırlatıcılar, zamanlanmış kontroller ve yinelenen işler için [zamanlanmış görevler](/tr/automation/cron-jobs) kullanın. Bellek, iki yolun etrafındaki kalıcı bağlamı yine de özetleyebilir.

Bu, her bellek için zorunlu bir şema değildir. Basit gerçekler kısa kalabilir. Zamanlama, yetki, sona erme veya eyleme geçme güvenliği bağlamının kaybedilmesi ajanın daha sonra yanlış şey yapmasına neden olabilecekse eyleme duyarlı sınırlar kullanın.

## Çıkarımsal commitments

Bazı gelecekteki takipler kalıcı gerçekler değildir. Yarın bir görüşmeden bahsederseniz yararlı bellek "görüşmeden sonra kontrol et" olabilir; "bunu sonsuza dek `MEMORY.md` içinde sakla" değil.

[Commitments](/tr/concepts/commitments), bu durum için katılım esaslı, kısa ömürlü takip bellekleridir. OpenClaw bunları gizli bir arka plan geçişinde çıkarır, aynı ajan ve kanalla sınırlar ve zamanı gelen kontrol bildirimlerini Heartbeat üzerinden iletir. Açık hatırlatıcılar hâlâ [zamanlanmış görevler](/tr/automation/cron-jobs) kullanır.

## Bellek araçları

Ajanın bellekle çalışmak için iki aracı vardır:

- **`memory_search`** — ifade özgün metinden farklı olsa bile anlamsal arama kullanarak ilgili notları bulur.
- **`memory_get`** — belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da Active Memory Plugin'i tarafından sağlanır (varsayılan: `memory-core`).

## Memory Wiki yardımcı Plugin'i

Kalıcı belleğin yalnızca ham notlar yerine bakımı yapılan bir bilgi tabanı gibi davranmasını istiyorsanız paketle gelen `memory-wiki` Plugin'ini kullanın.

`memory-wiki`, kalıcı bilgiyi şu özelliklere sahip bir wiki kasasına derler:

- deterministik sayfa yapısı
- yapılandırılmış iddialar ve kanıtlar
- çelişki ve güncellik takibi
- oluşturulan panolar
- ajan/çalışma zamanı tüketicileri için derlenmiş özetler
- `wiki_search`, `wiki_get`, `wiki_apply` ve `wiki_lint` gibi wiki'ye özgü araçlar

Active Memory Plugin'inin yerini almaz. Active Memory Plugin'i hâlâ geri çağırma, yükseltme ve Dreaming'in sahibidir. `memory-wiki`, bunun yanına köken bilgisi açısından zengin bir bilgi katmanı ekler.

Bkz. [Memory Wiki](/tr/plugins/memory-wiki).

## Bellek araması

Bir embedding sağlayıcısı yapılandırıldığında `memory_search` **hibrit arama** kullanır: vektör benzerliğini (anlamsal anlam) anahtar kelime eşleştirmeyle (ID'ler ve kod sembolleri gibi kesin terimler) birleştirir. Desteklenen herhangi bir sağlayıcı için API anahtarınız olduğunda bu kutudan çıktığı gibi çalışır.

<Info>
OpenClaw varsayılan olarak OpenAI embeddings kullanır. Gemini, Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot veya OpenAI uyumlu embeddings kullanmak için `agents.defaults.memorySearch.provider` değerini açıkça ayarlayın.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu hakkında ayrıntılar için bkz. [Bellek Araması](/tr/concepts/memory-search).

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar kelime araması, vektör benzerliği ve hibrit arama ile kutudan çıktığı gibi çalışır. Ek bağımlılık yoktur.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki dizinleri indeksleme yeteneği olan yerel öncelikli sidecar.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çoklu ajan farkındalığı içeren AI-native oturumlar arası bellek. Plugin kurulumu.
</Card>
<Card title="LanceDB" icon="layers" href="/tr/plugins/memory-lancedb">
OpenAI uyumlu embeddings, otomatik geri çağırma, otomatik yakalama ve yerel Ollama embedding desteği ile paketle gelen LanceDB destekli bellek.
</Card>
</CardGroup>

## Bilgi wiki katmanı

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar, panolar, köprü modu ve Obsidian dostu iş akışları içeren, köken bilgisi açısından zengin bir wiki kasasına derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw, ajana önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur çalıştırır. Bu varsayılan olarak açıktır; herhangi bir şey yapılandırmanız gerekmez.

Bu temizlik turunu yerel bir modelde tutmak için tam bir bellek boşaltma modeli geçersiz kılması ayarlayın:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Geçersiz kılma yalnızca bellek boşaltma turuna uygulanır ve etkin oturum fallback zincirini devralmaz.

<Tip>
Bellek boşaltma, Compaction sırasında bağlam kaybını önler. Ajanınızın konuşmada henüz bir dosyaya yazılmamış önemli gerçekleri varsa, özet gerçekleşmeden önce otomatik olarak kaydedilir.
</Tip>

## Dreaming

Dreaming, bellek için isteğe bağlı bir arka plan konsolidasyon geçişidir. Kısa süreli sinyalleri toplar, adayları puanlar ve yalnızca nitelikli öğeleri uzun süreli belleğe (`MEMORY.md`) yükseltir.

Uzun süreli belleği yüksek sinyalli tutmak için tasarlanmıştır:

- **Katılım esaslı**: varsayılan olarak devre dışıdır.
- **Zamanlanmış**: etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması için yinelenen bir Cron işini otomatik olarak yönetir.
- **Eşikli**: yükseltmeler puan, geri çağırma sıklığı ve sorgu çeşitliliği kapılarından geçmelidir.
- **İncelenebilir**: aşama özetleri ve günlük girdileri insan incelemesi için `DREAMS.md` içine yazılır.

Aşama davranışı, puanlama sinyalleri ve Dream Günlüğü ayrıntıları için bkz. [Dreaming](/tr/concepts/dreaming).

## Temellendirilmiş geri doldurma ve canlı yükseltme

Dreaming sisteminde artık yakından ilişkili iki inceleme hattı vardır:

- **Canlı Dreaming**, `memory/.dreams/` altındaki kısa süreli Dreaming deposundan çalışır ve normal derin aşamanın neyin `MEMORY.md` içine mezun olabileceğine karar verirken kullandığı şeydir.
- **Temellendirilmiş geri doldurma**, geçmiş `memory/YYYY-MM-DD.md` notlarını bağımsız gün dosyaları olarak okur ve yapılandırılmış inceleme çıktısını `DREAMS.md` içine yazar.

Temellendirilmiş geri doldurma, eski notları yeniden oynatmak ve `MEMORY.md` dosyasını elle düzenlemeden sistemin neyi kalıcı gördüğünü incelemek istediğinizde yararlıdır.

Şunu kullandığınızda:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

temellendirilmiş kalıcı adaylar doğrudan yükseltilmez. Normal derin aşamanın zaten kullandığı aynı kısa süreli Dreaming deposuna aşamalandırılır. Bunun anlamı:

- `DREAMS.md` insan inceleme yüzeyi olarak kalır.
- kısa süreli depo makineye dönük sıralama yüzeyi olarak kalır.
- `MEMORY.md` hâlâ yalnızca derin yükseltme tarafından yazılır.

Yeniden oynatmanın yararlı olmadığına karar verirseniz, sıradan günlük girdilerine veya normal geri çağırma durumuna dokunmadan aşamalandırılmış artifaktları kaldırabilirsiniz:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Daha fazla okuma

- [Yerleşik bellek motoru](/tr/concepts/memory-builtin): varsayılan SQLite arka ucu.
- [QMD bellek motoru](/tr/concepts/memory-qmd): gelişmiş yerel öncelikli sidecar.
- [Honcho belleği](/tr/concepts/memory-honcho): AI-native oturumlar arası bellek.
- [Memory LanceDB](/tr/plugins/memory-lancedb): OpenAI uyumlu embeddings ile LanceDB destekli Plugin.
- [Memory Wiki](/tr/plugins/memory-wiki): derlenmiş bilgi kasası ve wiki'ye özgü araçlar.
- [Bellek araması](/tr/concepts/memory-search): arama hattı, sağlayıcılar ve ayarlama.
- [Dreaming](/tr/concepts/dreaming): kısa süreli geri çağırmadan uzun süreli belleğe arka plan yükseltmesi.
- [Bellek yapılandırma referansı](/tr/reference/memory-config): tüm yapılandırma düğmeleri.
- [Compaction](/tr/concepts/compaction): Compaction'ın bellekle nasıl etkileşime girdiği.

## İlgili

- [Active Memory](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
- [Memory LanceDB](/tr/plugins/memory-lancedb)
- [Commitments](/tr/concepts/commitments)
