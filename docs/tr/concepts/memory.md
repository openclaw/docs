---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarını yazacağınızı bilmek istiyorsunuz
summary: OpenClaw oturumlar arasında bilgileri nasıl hatırlar
title: Belleğe genel bakış
x-i18n:
    generated_at: "2026-05-10T19:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw, agentinizin çalışma alanına **düz Markdown dosyaları** yazarak şeyleri hatırlar. Model yalnızca diske kaydedilenleri "hatırlar"; gizli durum yoktur.

## Nasıl çalışır?

Agentinizin bellekle ilgili üç dosyası vardır:

- **`MEMORY.md`** — uzun vadeli bellek. Kalıcı olgular, tercihler ve
  kararlar. Her DM oturumunun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** — günlük notlar. Devam eden bağlam ve gözlemler.
  Bugünün ve dünün notları otomatik olarak yüklenir.
- **`DREAMS.md`** (isteğe bağlı) — insan incelemesi için Dream Diary ve dreaming tarama
  özetleri; temellendirilmiş geçmişe dönük doldurma girdileri dahil.

Bu dosyalar agent çalışma alanında bulunur (varsayılan `~/.openclaw/workspace`).

## Ne nereye gider?

`MEMORY.md` kompakt, düzenlenmiş katmandır. Kalıcı olgular,
tercihler, sürekli geçerli kararlar ve ana özel oturumun başında kullanılabilir
olması gereken kısa özetler için kullanın. Ham bir transkript,
günlük kayıt veya kapsamlı arşiv olması amaçlanmaz.

`memory/YYYY-MM-DD.md` dosyaları çalışma katmanıdır. Ayrıntılı günlük
notlar, gözlemler, oturum özetleri ve daha sonra hâlâ yararlı olabilecek ham
bağlam için kullanın. Bu dosyalar `memory_search` ve `memory_get` için
dizinlenir, ancak her turda normal başlangıç istemine enjekte edilmez.

Zamanla agentin, günlük notlardaki yararlı materyali `MEMORY.md` içine
damıtması ve eskimiş uzun vadeli girdileri kaldırması beklenir. Üretilen
çalışma alanı talimatları ve Heartbeat akışı bunu periyodik olarak yapabilir;
hatırlanan her ayrıntı için `MEMORY.md` dosyasını elle düzenlemeniz gerekmez.

`MEMORY.md` başlangıç dosyası bütçesini aşarsa OpenClaw dosyayı diskte olduğu
gibi tutar, ancak model bağlamına enjekte edilen kopyayı kırpar. Bunu,
ayrıntılı materyali yeniden `memory/*.md` içine taşımanız, `MEMORY.md` içinde
yalnızca kalıcı özeti tutmanız veya açıkça daha fazla istem bütçesi harcamak
istiyorsanız başlangıç sınırlarını yükseltmeniz gerektiğine dair bir işaret
olarak değerlendirin. Ham ve enjekte edilen boyutları ve kırpma durumunu görmek
için `/context list`, `/context detail` veya `openclaw doctor` kullanın.

<Tip>
Agentinizin bir şeyi hatırlamasını istiyorsanız, ona söylemeniz yeterli:
"TypeScript tercih ettiğimi hatırla." Bunu uygun dosyaya yazar.
</Tip>

## Çıkarılan taahhütler

Bazı gelecekteki takipler kalıcı olgular değildir. Yarın bir görüşmeden söz
ederseniz yararlı bellek "bunu sonsuza dek `MEMORY.md` içinde sakla" değil,
"görüşmeden sonra kontrol et" olabilir.

[Taahhütler](/tr/concepts/commitments), bu durum için isteğe bağlı, kısa ömürlü
takip bellekleridir. OpenClaw bunları gizli bir arka plan geçişinde çıkarır,
aynı agent ve kanalla sınırlar ve zamanı gelen kontrolleri Heartbeat üzerinden
iletir. Açık hatırlatıcılar yine [zamanlanmış görevler](/tr/automation/cron-jobs)
kullanır.

## Bellek araçları

Agentin bellekle çalışmak için iki aracı vardır:

- **`memory_search`** — ifade özgün metinden farklı olsa bile anlamsal arama
  kullanarak ilgili notları bulur.
- **`memory_get`** — belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da etkin bellek plugin'i tarafından sağlanır (varsayılan: `memory-core`).

## Memory Wiki tamamlayıcı plugin'i

Kalıcı belleğin yalnızca ham notlar yerine bakımı yapılan bir bilgi tabanı gibi
davranmasını istiyorsanız, birlikte gelen `memory-wiki` plugin'ini kullanın.

`memory-wiki`, kalıcı bilgiyi şu özelliklere sahip bir wiki kasasına derler:

- belirlenimci sayfa yapısı
- yapılandırılmış iddialar ve kanıtlar
- çelişki ve güncellik takibi
- üretilen panolar
- agent/çalışma zamanı tüketicileri için derlenmiş özetler
- `wiki_search`, `wiki_get`, `wiki_apply` ve `wiki_lint` gibi wiki-yerel araçlar

Etkin bellek plugin'inin yerini almaz. Etkin bellek plugin'i hatırlama,
yükseltme ve Dreaming sahipliğini sürdürür. `memory-wiki` bunun yanına
köken bilgisi açısından zengin bir bilgi katmanı ekler.

Bkz. [Memory Wiki](/tr/plugins/memory-wiki).

## Bellek araması

Bir embedding sağlayıcısı yapılandırıldığında `memory_search` **hibrit
arama** kullanır: vektör benzerliğini (anlamsal anlam) anahtar sözcük
eşleştirmesiyle (kimlikler ve kod sembolleri gibi tam terimler) birleştirir.
Desteklenen herhangi bir sağlayıcı için API anahtarınız olduğunda bu, kutudan
çıktığı gibi çalışır.

<Info>
OpenClaw, mevcut API anahtarlarından embedding sağlayıcınızı otomatik algılar.
Yapılandırılmış bir OpenAI, Gemini, Voyage veya Mistral anahtarınız varsa bellek
araması otomatik olarak etkinleştirilir.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu hakkında
ayrıntılar için bkz. [Bellek araması](/tr/concepts/memory-search).

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve hibrit aramayla
kutudan çıktığı gibi çalışır. Ek bağımlılık yoktur.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki dizinleri
dizinleme yeteneği sunan yerel öncelikli sidecar.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çoklu agent farkındalığı içeren AI-yerel
oturumlar arası bellek. Plugin kurulumu.
</Card>
<Card title="LanceDB" icon="layers" href="/tr/plugins/memory-lancedb">
OpenAI uyumlu embedding'ler, otomatik hatırlama, otomatik yakalama ve yerel
Ollama embedding desteği içeren, birlikte gelen LanceDB destekli bellek.
</Card>
</CardGroup>

## Bilgi wiki katmanı

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar, panolar, köprü modu ve Obsidian dostu iş akışlarıyla
köken bilgisi açısından zengin bir wiki kasasına derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw,
agente önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur
çalıştırır. Bu varsayılan olarak açıktır; herhangi bir şey yapılandırmanız gerekmez.

Bu bakım turunu yerel bir modelde tutmak için tam bir bellek-boşaltma modeli
geçersiz kılması ayarlayın:

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

Geçersiz kılma yalnızca bellek-boşaltma turuna uygulanır ve etkin oturum yedek
zincirini devralmaz.

<Tip>
Bellek boşaltma, Compaction sırasında bağlam kaybını önler. Agentinizin
konuşmada henüz bir dosyaya yazılmamış önemli olguları varsa, özetleme
gerçekleşmeden önce otomatik olarak kaydedilirler.
</Tip>

## Dreaming

Dreaming, bellek için isteğe bağlı bir arka plan pekiştirme geçişidir. Kısa
vadeli sinyalleri toplar, adayları puanlar ve yalnızca nitelikli öğeleri uzun
vadeli belleğe (`MEMORY.md`) yükseltir.

Uzun vadeli belleği yüksek sinyalli tutmak için tasarlanmıştır:

- **İsteğe bağlı**: varsayılan olarak devre dışıdır.
- **Zamanlanmış**: etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması
  için yinelenen tek bir cron işini otomatik yönetir.
- **Eşikli**: yükseltmeler puan, hatırlama sıklığı ve sorgu çeşitliliği
  kapılarından geçmelidir.
- **İncelenebilir**: aşama özetleri ve günlük girdileri insan incelemesi için
  `DREAMS.md` dosyasına yazılır.

Aşama davranışı, puanlama sinyalleri ve Dream Diary ayrıntıları için bkz.
[Dreaming](/tr/concepts/dreaming).

## Temellendirilmiş geçmişe dönük doldurma ve canlı yükseltme

Dreaming sisteminin artık yakından ilişkili iki inceleme hattı vardır:

- **Canlı Dreaming**, `memory/.dreams/` altındaki kısa vadeli Dreaming
  deposundan çalışır ve normal derin aşamanın neyin `MEMORY.md` içine
  yükselebileceğine karar verirken kullandığı şeydir.
- **Temellendirilmiş geçmişe dönük doldurma**, geçmiş `memory/YYYY-MM-DD.md`
  notlarını bağımsız gün dosyaları olarak okur ve yapılandırılmış inceleme
  çıktısını `DREAMS.md` içine yazar.

Temellendirilmiş geçmişe dönük doldurma, eski notları yeniden oynatmak ve
`MEMORY.md` dosyasını elle düzenlemeden sistemin neleri kalıcı gördüğünü
incelemek istediğinizde yararlıdır.

Şunu kullandığınızda:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

temellendirilmiş kalıcı adaylar doğrudan yükseltilmez. Normal derin aşamanın
zaten kullandığı aynı kısa vadeli Dreaming deposuna hazırlanırlar. Bunun anlamı:

- `DREAMS.md` insan inceleme yüzeyi olarak kalır.
- kısa vadeli depo makineye dönük sıralama yüzeyi olarak kalır.
- `MEMORY.md` hâlâ yalnızca derin yükseltme tarafından yazılır.

Yeniden oynatmanın yararlı olmadığına karar verirseniz, olağan günlük
girdilerine veya normal hatırlama durumuna dokunmadan hazırlanan artifaktları
kaldırabilirsiniz:

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

## Ek okuma

- [Yerleşik bellek motoru](/tr/concepts/memory-builtin): varsayılan SQLite arka ucu.
- [QMD bellek motoru](/tr/concepts/memory-qmd): gelişmiş yerel öncelikli sidecar.
- [Honcho bellek](/tr/concepts/memory-honcho): AI-yerel oturumlar arası bellek.
- [Memory LanceDB](/tr/plugins/memory-lancedb): OpenAI uyumlu embedding'lere sahip LanceDB destekli plugin.
- [Memory Wiki](/tr/plugins/memory-wiki): derlenmiş bilgi kasası ve wiki-yerel araçlar.
- [Bellek araması](/tr/concepts/memory-search): arama işlem hattı, sağlayıcılar ve ayarlama.
- [Dreaming](/tr/concepts/dreaming): kısa vadeli hatırlamadan uzun vadeli belleğe arka plan yükseltmesi.
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config): tüm yapılandırma düğmeleri.
- [Compaction](/tr/concepts/compaction): Compaction'ın bellekle nasıl etkileştiği.

## İlgili

- [Active memory](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho bellek](/tr/concepts/memory-honcho)
- [Memory LanceDB](/tr/plugins/memory-lancedb)
- [Taahhütler](/tr/concepts/commitments)
