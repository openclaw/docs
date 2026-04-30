---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarını yazacağınızı bilmek istiyorsunuz
summary: OpenClaw oturumlar arasında bilgileri nasıl hatırlar
title: Belleğe genel bakış
x-i18n:
    generated_at: "2026-04-30T09:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw, bir şeyleri ajanınızın çalışma alanına **düz Markdown dosyaları**
yazarak hatırlar. Model yalnızca diske kaydedilenleri "hatırlar"; gizli durum
yoktur.

## Nasıl çalışır

Ajanınızda bellekle ilgili üç dosya vardır:

- **`MEMORY.md`** — uzun vadeli bellek. Kalıcı bilgiler, tercihler ve
  kararlar. Her DM oturumunun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** — günlük notlar. Süregelen bağlam ve gözlemler.
  Bugünün ve dünün notları otomatik olarak yüklenir.
- **`DREAMS.md`** (isteğe bağlı) — insan incelemesi için Dream Diary ve dreaming
  taraması özetleri; temellendirilmiş tarihsel geri doldurma girdileri dahil.

Bu dosyalar ajan çalışma alanında bulunur (varsayılan `~/.openclaw/workspace`).

<Tip>
Ajanınızın bir şeyi hatırlamasını istiyorsanız, ona söylemeniz yeterlidir:
"TypeScript'i tercih ettiğimi hatırla." Bunu uygun dosyaya yazar.
</Tip>

## Çıkarılan taahhütler

Bazı gelecekteki takipler kalıcı bilgiler değildir. Yarın bir görüşmeden
bahsederseniz, yararlı bellek "bunu sonsuza dek `MEMORY.md` içinde sakla" değil,
"görüşmeden sonra kontrol et" olabilir.

[Taahhütler](/tr/concepts/commitments), bu durum için isteğe bağlı, kısa ömürlü
takip bellekleridir. OpenClaw bunları gizli bir arka plan geçişinde çıkarır,
aynı ajan ve kanalla sınırlar ve zamanı gelen kontrolleri Heartbeat üzerinden
iletir. Açık hatırlatıcılar hâlâ [zamanlanmış görevleri](/tr/automation/cron-jobs)
kullanır.

## Bellek araçları

Ajanın bellekle çalışmak için iki aracı vardır:

- **`memory_search`** — ifade biçimi özgünden farklı olsa bile, anlamsal arama
  kullanarak ilgili notları bulur.
- **`memory_get`** — belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da etkin bellek Plugin'i tarafından sağlanır (varsayılan:
`memory-core`).

## Memory Wiki eşlikçi Plugin'i

Kalıcı belleğin yalnızca ham notlar olmaktan çok, bakımı yapılan bir bilgi
tabanı gibi davranmasını istiyorsanız, birlikte gelen `memory-wiki` Plugin'ini
kullanın.

`memory-wiki`, kalıcı bilgiyi şu özelliklere sahip bir wiki kasasına derler:

- deterministik sayfa yapısı
- yapılandırılmış iddialar ve kanıtlar
- çelişki ve güncellik takibi
- oluşturulan panolar
- ajan/çalışma zamanı tüketicileri için derlenmiş özetler
- `wiki_search`, `wiki_get`, `wiki_apply` ve `wiki_lint` gibi wikiye özgü araçlar

Etkin bellek Plugin'inin yerini almaz. Etkin bellek Plugin'i hatırlama, terfi ve
Dreaming sahipliğini sürdürür. `memory-wiki`, bunun yanına köken bilgisi zengin
bir bilgi katmanı ekler.

Bkz. [Memory Wiki](/tr/plugins/memory-wiki).

## Bellek araması

Bir gömme sağlayıcısı yapılandırıldığında, `memory_search` **hibrit arama**
kullanır: vektör benzerliğini (anlamsal anlam) anahtar sözcük eşleştirmeyle
(ID'ler ve kod sembolleri gibi tam terimler) birleştirir. Desteklenen herhangi
bir sağlayıcı için bir API anahtarınız olduğunda bu kutudan çıktığı gibi çalışır.

<Info>
OpenClaw, gömme sağlayıcınızı kullanılabilir API anahtarlarından otomatik olarak
algılar. Yapılandırılmış bir OpenAI, Gemini, Voyage veya Mistral anahtarınız
varsa bellek araması otomatik olarak etkinleşir.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu hakkında
ayrıntılar için bkz. [Bellek Araması](/tr/concepts/memory-search).

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve hibrit aramayla
kutudan çıktığı gibi çalışır. Ek bağımlılık yoktur.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki dizinleri
indeksleme yeteneğine sahip, yerel öncelikli sidecar.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çok ajanlı farkındalık içeren AI-native
oturumlar arası bellek. Plugin kurulumu.
</Card>
<Card title="LanceDB" icon="layers" href="/tr/plugins/memory-lancedb">
OpenAI uyumlu gömmeler, otomatik hatırlama, otomatik yakalama ve yerel Ollama
gömme desteği sunan, birlikte gelen LanceDB destekli bellek.
</Card>
</CardGroup>

## Bilgi wiki katmanı

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar, panolar, köprü modu ve Obsidian dostu iş akışları
içeren, köken bilgisi zengin bir wiki kasasına derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw, ajana
önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur
çalıştırır. Bu varsayılan olarak açıktır; hiçbir şey yapılandırmanız gerekmez.

Bu bakım turunu yerel bir modelde tutmak için tam bir bellek boşaltma modeli
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

Geçersiz kılma yalnızca bellek boşaltma turuna uygulanır ve etkin oturumun
yedek zincirini devralmaz.

<Tip>
Bellek boşaltma, Compaction sırasında bağlam kaybını önler. Ajanınızın
konuşmada henüz bir dosyaya yazılmamış önemli bilgileri varsa, özetleme
gerçekleşmeden önce bunlar otomatik olarak kaydedilir.
</Tip>

## Dreaming

Dreaming, bellek için isteğe bağlı bir arka plan pekiştirme geçişidir. Kısa
vadeli sinyalleri toplar, adayları puanlar ve yalnızca uygun öğeleri uzun
vadeli belleğe (`MEMORY.md`) terfi ettirir.

Uzun vadeli belleği yüksek sinyalli tutmak için tasarlanmıştır:

- **İsteğe bağlı**: varsayılan olarak devre dışıdır.
- **Zamanlanmış**: etkinleştirildiğinde `memory-core`, tam bir dreaming taraması
  için yinelenen bir cron işini otomatik olarak yönetir.
- **Eşikli**: terfiler puan, hatırlama sıklığı ve sorgu çeşitliliği kapılarını
  geçmelidir.
- **İncelenebilir**: aşama özetleri ve günlük girdileri insan incelemesi için
  `DREAMS.md` dosyasına yazılır.

Aşama davranışı, puanlama sinyalleri ve Dream Diary ayrıntıları için bkz.
[Dreaming](/tr/concepts/dreaming).

## Temellendirilmiş geri doldurma ve canlı terfi

Dreaming sisteminde artık yakından ilişkili iki inceleme hattı vardır:

- **Canlı dreaming**, `memory/.dreams/` altındaki kısa vadeli dreaming deposundan
  çalışır ve normal derin aşamanın `MEMORY.md` dosyasına neyin geçebileceğine
  karar verirken kullandığı yoldur.
- **Temellendirilmiş geri doldurma**, geçmiş `memory/YYYY-MM-DD.md` notlarını
  bağımsız gün dosyaları olarak okur ve yapılandırılmış inceleme çıktısını
  `DREAMS.md` dosyasına yazar.

Temellendirilmiş geri doldurma, eski notları yeniden oynatmak ve sistemin neyi
kalıcı gördüğünü `MEMORY.md` dosyasını elle düzenlemeden incelemek istediğinizde
yararlıdır.

Şunu kullandığınızda:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

temellendirilmiş kalıcı adaylar doğrudan terfi ettirilmez. Normal derin aşamanın
zaten kullandığı aynı kısa vadeli dreaming deposuna sahnelenirler. Bunun anlamı:

- `DREAMS.md`, insan inceleme yüzeyi olarak kalır.
- kısa vadeli depo, makineye dönük sıralama yüzeyi olarak kalır.
- `MEMORY.md` hâlâ yalnızca derin terfi tarafından yazılır.

Yeniden oynatmanın yararlı olmadığına karar verirseniz, sıradan günlük
girdilerine veya normal hatırlama durumuna dokunmadan sahnelenen artifaktları
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
- [Honcho belleği](/tr/concepts/memory-honcho): AI-native oturumlar arası bellek.
- [Memory LanceDB](/tr/plugins/memory-lancedb): OpenAI uyumlu gömmelere sahip LanceDB destekli Plugin.
- [Memory Wiki](/tr/plugins/memory-wiki): derlenmiş bilgi kasası ve wikiye özgü araçlar.
- [Bellek araması](/tr/concepts/memory-search): arama hattı, sağlayıcılar ve ayarlama.
- [Dreaming](/tr/concepts/dreaming): kısa vadeli hatırlamadan uzun vadeli belleğe arka plan terfisi.
- [Bellek yapılandırması başvurusu](/tr/reference/memory-config): tüm yapılandırma düğmeleri.
- [Compaction](/tr/concepts/compaction): Compaction'ın bellekle nasıl etkileştiği.

## İlgili

- [Active Memory](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
- [Memory LanceDB](/tr/plugins/memory-lancedb)
- [Taahhütler](/tr/concepts/commitments)
