---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarını yazmanız gerektiğini bilmek istiyorsunuz
summary: OpenClaw'ın oturumlar arasında şeyleri nasıl hatırladığı
title: Belleğe genel bakış
x-i18n:
    generated_at: "2026-04-24T09:05:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw, aracı çalışma alanınızda **düz Markdown dosyaları** yazarak şeyleri hatırlar. Model yalnızca diske kaydedilenleri "hatırlar" — gizli bir durum yoktur.

## Nasıl çalışır

Aracınızın bellekle ilgili üç dosyası vardır:

- **`MEMORY.md`** -- uzun vadeli bellek. Kalıcı gerçekler, tercihler ve
  kararlar. Her DM oturumunun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** -- günlük notlar. Akan bağlam ve gözlemler.
  Bugünün ve dünün notları otomatik olarak yüklenir.
- **`DREAMS.md`** (isteğe bağlı) -- Dream Diary ve insan incelemesi için Dreaming taraması
  özetleri; temellendirilmiş geçmişe dönük doldurma girdileri dahil.

Bu dosyalar aracı çalışma alanında yaşar (varsayılan `~/.openclaw/workspace`).

<Tip>
Aracınızın bir şeyi hatırlamasını istiyorsanız, sadece söyleyin: "TypeScript tercih ettiğimi
hatırla." Bunu uygun dosyaya yazar.
</Tip>

## Bellek araçları

Aracının bellekle çalışmak için iki aracı vardır:

- **`memory_search`** -- ifade biçimi asıl olandan farklı olsa bile,
  anlamsal arama kullanarak ilgili notları bulur.
- **`memory_get`** -- belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da etkin bellek Plugin'i tarafından sağlanır (varsayılan: `memory-core`).

## Memory Wiki yardımcı Plugin'i

Kalıcı belleğin yalnızca ham notlardan ziyade daha çok bakımı yapılan bir bilgi tabanı gibi davranmasını istiyorsanız,
paketlenmiş `memory-wiki` Plugin'ini kullanın.

`memory-wiki`, kalıcı bilgiyi şu özelliklere sahip bir wiki kasasına derler:

- belirleyici sayfa yapısı
- yapılandırılmış iddialar ve kanıtlar
- çelişki ve güncellik takibi
- oluşturulmuş panolar
- aracı/çalışma zamanı tüketicileri için derlenmiş özetler
- `wiki_search`, `wiki_get`, `wiki_apply` ve `wiki_lint` gibi wiki'ye özgü araçlar

Bu, etkin bellek Plugin'inin yerini almaz. Etkin bellek Plugin'i hâlâ
geri çağırma, yükseltme ve Dreaming işlemlerinin sahibidir. `memory-wiki`, onun yanına
kanıt kaynağı zengin bir bilgi katmanı ekler.

Bkz. [Memory Wiki](/tr/plugins/memory-wiki).

## Bellek araması

Bir embedding sağlayıcısı yapılandırıldığında `memory_search`, **hibrit
arama** kullanır — vektör benzerliğini (anlamsal anlam) anahtar sözcük eşleştirmesiyle
(kimlikler ve kod sembolleri gibi tam terimler) birleştirir. Desteklenen herhangi bir sağlayıcı için
API anahtarına sahip olduğunuzda bu kutudan çıktığı gibi çalışır.

<Info>
OpenClaw, kullanılabilir API anahtarlarından embedding sağlayıcınızı otomatik olarak algılar. OpenAI, Gemini, Voyage veya Mistral anahtarınız
yapılandırılmışsa, bellek araması
otomatik olarak etkinleşir.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu hakkında ayrıntılar için
bkz. [Memory Search](/tr/concepts/memory-search).

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve
hibrit arama ile kutudan çıktığı gibi çalışır. Ek bağımlılık yoktur.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki
dizinleri dizinleyebilme yeteneğine sahip local-first sidecar.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve
çok aracılı farkındalık ile AI-native oturumlar arası bellek. Plugin kurulumu gerekir.
</Card>
</CardGroup>

## Bilgi wiki katmanı

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar,
panolar, köprü modu ve Obsidian dostu iş akışlarıyla kanıt kaynağı zengin bir wiki kasasına derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw,
aracıya önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur çalıştırır.
Bu varsayılan olarak açıktır — herhangi bir yapılandırma yapmanız gerekmez.

<Tip>
Bellek boşaltma, Compaction sırasında bağlam kaybını önler. Aracınızın
konuşmada henüz bir dosyaya yazılmamış önemli gerçekleri varsa,
özetleme gerçekleşmeden önce bunlar otomatik olarak kaydedilir.
</Tip>

## Dreaming

Dreaming, bellek için isteğe bağlı bir arka plan pekiştirme geçişidir. Kısa vadeli sinyalleri toplar,
adayları puanlar ve yalnızca uygun öğeleri uzun vadeli belleğe (`MEMORY.md`) yükseltir.

Uzun vadeli belleği yüksek sinyalli tutmak için tasarlanmıştır:

- **İsteğe bağlı**: varsayılan olarak devre dışıdır.
- **Zamanlanmış**: etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması
  için yinelenen tek bir cron işini otomatik yönetir.
- **Eşikli**: yükseltmeler puan, geri çağırma sıklığı ve sorgu
  çeşitliliği geçitlerini geçmelidir.
- **İncelenebilir**: faz özetleri ve günlük girdileri insan incelemesi için `DREAMS.md`
  dosyasına yazılır.

Faz davranışı, puanlama sinyalleri ve Dream Diary ayrıntıları için
bkz. [Dreaming](/tr/concepts/dreaming).

## Temellendirilmiş geçmiş doldurma ve canlı yükseltme

Dreaming sistemi artık birbiriyle yakından ilişkili iki inceleme yoluna sahiptir:

- **Canlı Dreaming**, `memory/.dreams/` altındaki kısa vadeli Dreaming deposundan çalışır
  ve normal derin fazın, neyin `MEMORY.md` içine
  yükselebileceğine karar verirken kullandığı şeydir.
- **Temellendirilmiş geçmiş doldurma**, geçmiş `memory/YYYY-MM-DD.md` notlarını
  bağımsız günlük dosyaları olarak okur ve yapılandırılmış inceleme çıktısını `DREAMS.md` içine yazar.

Temellendirilmiş geçmiş doldurma, eski notları yeniden oynatmak ve sistemin
elle `MEMORY.md` düzenlemeden neyin kalıcı olduğunu düşündüğünü incelemek istediğinizde kullanışlıdır.

Şunu kullandığınızda:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

temellendirilmiş kalıcı adaylar doğrudan yükseltilmez. Bunun yerine
normal derin fazın zaten kullandığı aynı kısa vadeli Dreaming deposuna hazırlanırlar. Bu şu anlama gelir:

- `DREAMS.md`, insan inceleme yüzeyi olarak kalır.
- kısa vadeli depo, makineye dönük sıralama yüzeyi olarak kalır.
- `MEMORY.md` hâlâ yalnızca derin yükseltme tarafından yazılır.

Yeniden oynatmanın yararlı olmadığına karar verirseniz, hazırlanmış yapıtları
normal günlük girdilerine veya normal geri çağırma durumuna dokunmadan kaldırabilirsiniz:

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

## Daha fazla okuma

- [Yerleşik Bellek Motoru](/tr/concepts/memory-builtin) -- varsayılan SQLite arka ucu
- [QMD Bellek Motoru](/tr/concepts/memory-qmd) -- gelişmiş local-first sidecar
- [Honcho Memory](/tr/concepts/memory-honcho) -- AI-native oturumlar arası bellek
- [Memory Wiki](/tr/plugins/memory-wiki) -- derlenmiş bilgi kasası ve wiki'ye özgü araçlar
- [Memory Search](/tr/concepts/memory-search) -- arama hattı, sağlayıcılar ve
  ayarlama
- [Dreaming](/tr/concepts/dreaming) -- kısa vadeli geri çağırmadan
  uzun vadeli belleğe arka plan yükseltme
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config) -- tüm yapılandırma seçenekleri
- [Compaction](/tr/concepts/compaction) -- Compaction'ın bellekle nasıl etkileştiği

## İlgili

- [Active Memory](/tr/concepts/active-memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
