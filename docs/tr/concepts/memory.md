---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarının yazılacağını bilmek istiyorsunuz
summary: OpenClaw oturumlar arasında bilgileri nasıl hatırlar
title: Belleğe genel bakış
x-i18n:
    generated_at: "2026-07-12T11:38:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw, aracınızın çalışma alanına (varsayılan olarak `~/.openclaw/workspace`) düz Markdown dosyaları yazarak bilgileri hatırlar. Model yalnızca diske kaydedilenleri hatırlar; gizli bir durum yoktur.

## Nasıl çalışır?

Aracınızın bellekle ilgili üç dosyası vardır:

- **`MEMORY.md`** — uzun süreli bellek. Kalıcı bilgiler, tercihler ve kararlar. Bir oturumun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** (veya `memory/YYYY-MM-DD-<slug>.md`) — günlük notlar. Devam eden bağlam ve gözlemler. Yalın bir `/new` veya `/reset` işleminde bugünün ve dünün tarihli notları otomatik olarak yüklenir; paketle birlikte gelen oturum belleği kancası tarafından yazılanlar gibi kısa adlı varyantlar da yalnızca tarih içeren dosyayla birlikte alınır.
- **`DREAMS.md`** (isteğe bağlı) — temellendirilmiş geçmişe dönük doldurma girdileri de dâhil olmak üzere, insanların incelemesi için Rüya Günlüğü ve Dreaming taraması özetleri.

<Tip>
Aracınızın bir şeyi hatırlamasını istiyorsanız yalnızca şunu söyleyin: "TypeScript'i tercih ettiğimi hatırla." Notu uygun dosyaya yazar.
</Tip>

## Hangi bilgi nereye gider?

`MEMORY.md`, kompakt ve özenle düzenlenmiş katmandır: bir oturumun başında erişilebilir olması gereken kalıcı bilgiler, tercihler, geçerli kararlar ve kısa özetler. Ham bir döküm, günlük kayıt veya kapsamlı bir arşiv değildir.

`memory/YYYY-MM-DD.md` dosyaları çalışma katmanıdır: daha sonra da yararlı olabilecek ayrıntılı günlük notlar, gözlemler, oturum özetleri ve ham bağlam. Bunlar `memory_search` ve `memory_get` için dizine eklenir, ancak her turda başlangıç istemine yerleştirilmez.

Araç, zaman içinde günlük notlardaki yararlı materyalleri süzerek `MEMORY.md` dosyasına aktarır ve eskimiş uzun süreli girdileri kaldırır. Oluşturulan çalışma alanı talimatları ve Heartbeat akışı bunu düzenli olarak gerçekleştirir; her ayrıntı için `MEMORY.md` dosyasını elle düzenlemeniz gerekmez.

`MEMORY.md` başlangıç dosyası bütçesini aşarsa OpenClaw diskteki dosyayı olduğu gibi korur ancak bağlama yerleştirilen kopyayı kısaltır. Bunu, ayrıntılı materyalleri `memory/*.md` içine taşımanız, `MEMORY.md` içinde yalnızca kalıcı bir özet tutmanız veya daha fazla istem bütçesi harcamak istiyorsanız başlangıç sınırlarını yükseltmeniz gerektiğine dair bir işaret olarak değerlendirin. Ham ve yerleştirilmiş boyutları ve kısaltma durumunu görmek için `/context list`, `/context detail` veya `openclaw doctor` kullanın.

## Eyleme duyarlı bellekler

Belleklerin çoğu sıradan Markdown notlarıdır. Bazıları aracın daha sonra ne yapması gerektiğini etkiler; bunlarda yalnızca bilginin kendisini değil, nota göre ne zaman güvenle harekete geçilebileceğini de kaydedin.

Bir not aşağıdakileri içeriyorsa bu eylem sınırını kaydedin:

- onay veya izin gereksinimleri,
- geçici kısıtlamalar,
- başka bir oturuma, ileti dizisine veya kişiye devirler,
- sona erme koşulları,
- güvenle harekete geçilebilecek zamanlama,
- kaynağın veya sahibin yetkisi,
- cazip bir eylemden kaçınmaya yönelik talimatlar.

Yararlı bir eyleme duyarlı bellek şunları açıkça belirtir:

- gelecekteki davranışı neyin değiştirdiğini,
- ne zaman veya hangi koşulda geçerli olduğunu,
- ne zaman sona erdiğini veya eylemin önünü neyin açtığını,
- aracın ne yapmaktan kaçınması gerektiğini,
- güveni veya yetkiyi etkiliyorsa kaynağın ya da sahibin kim olduğunu.

Bellek, onay bağlamını koruyabilir ancak ilkeyi uygulamaz. Kesin operasyonel denetimler için OpenClaw onay ayarlarını, korumalı alanı ve zamanlanmış görevleri kullanın.

Örnek:

```md
API geçişi başka bir oturumda tasarlanıyor. Gelecekteki turlar API
uygulamasını bu ileti dizisinden düzenlememeli; geçiş planı tamamlanana kadar
buradaki bulguları yalnızca tasarım girdisi olarak kullanmalıdır.
```

Başka bir örnek:

```md
Güvenilmeyen bir kaynaktan gelen rapor, öne çıkarılmadan önce incelenmelidir.
Gelecekteki turlar bunu yalnızca kanıt olarak değerlendirmeli; güvenilir bir
incelemeci içeriği doğrulayana kadar kalıcı belleğe kaydetmemelidir.
```

Bu, her bellek için zorunlu bir şema değildir; basit bilgiler kısa tutulabilir. Zamanlamanın, yetkinin, sona ermenin veya güvenle harekete geçme bağlamının kaybolması aracın daha sonra yanlış bir şey yapmasına yol açabilecekse eyleme duyarlı sınırlar kullanın.

Çıkarılan kısa ömürlü takip işlemleri için [taahhütleri](/tr/concepts/commitments) kullanın. Kesin hatırlatmalar, zamanlanmış kontroller ve yinelenen işler için [zamanlanmış görevleri](/tr/automation/cron-jobs) kullanın. Bellek, her iki yolun çevresindeki kalıcı bağlamı yine de özetleyebilir.

## Çıkarılan taahhütler

Gelecekteki bazı takip işlemleri kalıcı bilgiler değildir. Yarın bir mülakattan bahsederseniz yararlı bellek, "bunu sonsuza dek `MEMORY.md` içinde sakla" değil, "mülakattan sonra nasıl geçtiğini sor" olabilir.

[Taahhütler](/tr/concepts/commitments), bu durum için isteğe bağlı, kısa ömürlü takip bellekleridir. OpenClaw bunları gizli bir arka plan geçişinde çıkarır, aynı araç ve kanalla sınırlar ve zamanı gelen takipleri Heartbeat üzerinden iletir. Açık hatırlatmalar için yine [zamanlanmış görevler](/tr/automation/cron-jobs) kullanılır.

## Bellek araçları

Aracın bellekle çalışmak için iki aracı vardır:

- **`memory_search`** — ifade özgün hâlinden farklı olsa bile anlamsal aramayı kullanarak ilgili notları bulur.
- **`memory_get`** — belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da etkin bellek Plugin'i tarafından sağlanır (varsayılan: `memory-core`).

## Bellek araması

Bir gömme sağlayıcısı yapılandırıldığında `memory_search`, vektör benzerliğini (anlamsal anlam) anahtar sözcük eşleştirmesiyle (kimlikler ve kod sembolleri gibi tam terimler) birleştiren karma aramayı kullanır. Bu, desteklenen herhangi bir sağlayıcının API anahtarıyla doğrudan çalışır.

<Info>
OpenClaw varsayılan olarak OpenAI gömmelerini kullanır. Gemini, Voyage, Mistral, Bedrock, DeepInfra, yerel GGUF, Ollama, LM Studio, GitHub Copilot veya genel bir OpenAI uyumlu uç nokta kullanmak için `agents.defaults.memorySearch.provider` değerini açıkça ayarlayın.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu için [Bellek araması](/tr/concepts/memory-search) bölümüne bakın.

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve karma aramayla doğrudan çalışır. Ek bağımlılık gerektirmez.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki dizinleri dizine ekleme özelliğine sahip, yerel öncelikli yardımcı süreç.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çoklu araç farkındalığı sunan, yapay zekâya özgü oturumlar arası bellek. Plugin kurulumu gerektirir.
</Card>
<Card title="LanceDB" icon="layers" href="/tr/plugins/memory-lancedb">
OpenAI uyumlu gömmeler, otomatik hatırlama, otomatik yakalama ve yerel Ollama gömme desteği sunan LanceDB destekli bellek. Plugin kurulumu gerektirir.
</Card>
</CardGroup>

## Bilgi vikisi katmanı

Kalıcı belleğin ham notlardan çok bakımı yapılan bir bilgi tabanı gibi davranmasını istiyorsanız paketle birlikte gelen `memory-wiki` Plugin'ini kullanın. Bu Plugin, kalıcı bilgileri belirlenimci sayfa yapısı, yapılandırılmış iddialar ve kanıtlar, çelişki ve güncellik takibi, oluşturulan panolar, derlenmiş özetler ve vikiye özgü araçlar (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`) içeren bir viki kasasında derler.

`memory-wiki`, etkin bellek Plugin'inin yerini almaz; hatırlama, öne çıkarma ve Dreaming işlemlerinin sahibi yine etkin bellek Plugin'idir. `memory-wiki`, bunun yanına kaynak geçmişi açısından zengin bir bilgi katmanı ekler.

<CardGroup cols={1}>
<Card title="Bellek Vikisi" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar, panolar, köprü modu ve Obsidian uyumlu iş akışları içeren, kaynak geçmişi açısından zengin bir viki kasasında derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw, araca önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur çalıştırır. Bu özellik varsayılan olarak açıktır; kapatmak için `agents.defaults.compaction.memoryFlush.enabled: false` değerini ayarlayın.

Bu bakım turunu yerel bir modelde tutmak için yalnızca bellek boşaltma turuna uygulanan tam bir geçersiz kılma ayarlayın (etkin oturumun model yedek zincirini devralmaz):

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

<Tip>
Bellek boşaltma, Compaction sırasında bağlam kaybını önler. Aracınızın konuşmada henüz bir dosyaya yazılmamış önemli bilgileri varsa özet oluşturulmadan önce bunlar otomatik olarak kaydedilir.
</Tip>

## Dreaming

Dreaming, bellek için isteğe bağlı bir arka plan birleştirme geçişidir. Kısa süreli hatırlama sinyallerini toplar, adayları puanlar ve yalnızca yeterli niteliklere sahip öğeleri uzun süreli belleğe (`MEMORY.md`) aktarır:

- **İsteğe bağlıdır**: varsayılan olarak devre dışıdır.
- **Zamanlanır**: etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması için yinelenen tek bir Cron işini otomatik olarak yönetir.
- **Eşiklere bağlıdır**: aktarımlar puan, hatırlama sıklığı ve sorgu çeşitliliği eşiklerini geçmelidir.
- **İncelenebilir**: aşama özetleri ve günlük girdileri insanların incelemesi için `DREAMS.md` dosyasına yazılır.

Aşama davranışı, puanlama sinyalleri ve Rüya Günlüğü ayrıntıları için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.

## Temellendirilmiş geçmişe dönük doldurma ve canlı aktarım

Dreaming sisteminin birbiriyle ilişkili iki inceleme yolu vardır:

- **Canlı Dreaming**, `memory/.dreams/` altındaki kısa süreli Dreaming deposundan çalışır ve normal derin aşamanın nelerin `MEMORY.md` içine aktarılacağına karar vermek için kullandığı yoldur.
- **Temellendirilmiş geçmişe dönük doldurma**, geçmiş `memory/YYYY-MM-DD.md` notlarını bağımsız günlük dosyaları olarak okur ve yapılandırılmış inceleme çıktısını `DREAMS.md` içine yazar.

Temellendirilmiş geçmişe dönük doldurma, eski notları yeniden oynatmak ve `MEMORY.md` dosyasını elle düzenlemeden sistemin neleri kalıcı kabul ettiğini incelemek için yararlıdır.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` bayrağı, temellendirilmiş kalıcı adayları normal derin aşamanın zaten kullandığı kısa süreli Dreaming deposunda hazırlar; onları doğrudan aktarmaz. Bu nedenle:

- `DREAMS.md`, insanların inceleme yüzeyi olarak kalır.
- Kısa süreli depo, makinelere yönelik sıralama yüzeyi olarak kalır.
- `MEMORY.md` hâlâ yalnızca derin aktarım tarafından yazılır.

Sıradan günlük girdilerine veya normal hatırlama durumuna dokunmadan yeniden oynatmayı geri almak için:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Dizin durumunu ve sağlayıcıyı kontrol et
openclaw memory search "query"  # Komut satırından ara
openclaw memory index --force   # Dizini yeniden oluştur
```

## Ek okumalar

- [Bellek araması](/tr/concepts/memory-search): arama işlem hattı, sağlayıcılar ve ayarlama.
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin): varsayılan SQLite arka ucu.
- [QMD bellek motoru](/tr/concepts/memory-qmd): gelişmiş, yerel öncelikli yardımcı süreç.
- [Honcho belleği](/tr/concepts/memory-honcho): yapay zekâya özgü oturumlar arası bellek.
- [LanceDB Belleği](/tr/plugins/memory-lancedb): OpenAI uyumlu gömmeler kullanan LanceDB destekli Plugin.
- [Bellek Vikisi](/tr/plugins/memory-wiki): derlenmiş bilgi kasası ve vikiye özgü araçlar.
- [Dreaming](/tr/concepts/dreaming): kısa süreli hatırlamadan uzun süreli belleğe arka planda aktarım.
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config): tüm yapılandırma seçenekleri.
- [Compaction](/tr/concepts/compaction): Compaction'ın bellekle nasıl etkileşime girdiği.
- [Active Memory](/tr/concepts/active-memory): etkileşimli sohbet oturumları için alt araç belleği.
