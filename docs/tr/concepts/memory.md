---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarını yazmanız gerektiğini öğrenmek istiyorsunuz
summary: OpenClaw'un oturumlar arasında şeyleri nasıl hatırladığı
title: Belleğe Genel Bakış
x-i18n:
    generated_at: "2026-04-08T06:00:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bb8552341b0b651609edaaae826a22fdc535d240aed4fad4af4b069454004af
    source_path: concepts/memory.md
    workflow: 15
---

# Belleğe Genel Bakış

OpenClaw, aracı workspace'inizde **düz Markdown dosyaları** yazarak şeyleri
hatırlar. Model yalnızca diske kaydedilenleri "hatırlar" -- gizli bir durum
yoktur.

## Nasıl çalışır

Aracınızın bellekle ilgili üç dosyası vardır:

- **`MEMORY.md`** -- uzun vadeli bellek. Kalıcı gerçekler, tercihler ve
  kararlar. Her DM oturumunun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** -- günlük notlar. Devam eden bağlam ve gözlemler.
  Bugünün ve dünkü notlar otomatik olarak yüklenir.
- **`DREAMS.md`** (deneysel, isteğe bağlı) -- insan incelemesi için Dream Diary
  ve dreaming sweep özetleri.

Bu dosyalar aracının workspace'inde bulunur (varsayılan olarak `~/.openclaw/workspace`).

<Tip>
Aracınızın bir şeyi hatırlamasını istiyorsanız, ona söylemeniz yeterlidir: "Benim
TypeScript'i tercih ettiğimi hatırla." Bunu uygun dosyaya yazar.
</Tip>

## Bellek araçları

Aracının bellekle çalışmak için iki aracı vardır:

- **`memory_search`** -- ifade biçimi orijinalden farklı olsa bile, anlamsal
  arama kullanarak ilgili notları bulur.
- **`memory_get`** -- belirli bir bellek dosyasını veya satır aralığını okur.

Bu araçların ikisi de etkin bellek plugin'i tarafından sağlanır (varsayılan: `memory-core`).

## Memory Wiki yardımcı plugin'i

Kalıcı belleğin yalnızca ham notlar gibi değil, bakımı yapılan bir bilgi tabanı
gibi davranmasını istiyorsanız, paketle gelen `memory-wiki` plugin'ini kullanın.

`memory-wiki`, kalıcı bilgiyi şu özelliklere sahip bir wiki kasasına derler:

- deterministik sayfa yapısı
- yapılandırılmış iddialar ve kanıtlar
- çelişki ve güncellik takibi
- oluşturulmuş panolar
- agent/runtime tüketicileri için derlenmiş özetler
- `wiki_search`, `wiki_get`, `wiki_apply` ve `wiki_lint` gibi wiki'ye özgü araçlar

Etkin bellek plugin'inin yerini almaz. Etkin bellek plugin'i hâlâ geri getirme,
yükseltme ve dreaming işlemlerine sahiptir. `memory-wiki`, bunun yanına
kaynak zenginliğine sahip bir bilgi katmanı ekler.

Bkz. [Memory Wiki](/tr/plugins/memory-wiki).

## Bellek araması

Bir embedding sağlayıcısı yapılandırıldığında, `memory_search` **hibrit
arama** kullanır -- vektör benzerliğini (anlamsal anlam) anahtar sözcük
eşleştirmesiyle (kimlikler ve kod sembolleri gibi tam terimler) birleştirir.
Desteklenen herhangi bir sağlayıcı için bir API anahtarınız olduğunda bu kutudan
çıktığı gibi çalışır.

<Info>
OpenClaw, kullanılabilir API anahtarlarından embedding sağlayıcınızı otomatik
olarak algılar. Yapılandırılmış bir OpenAI, Gemini, Voyage veya Mistral
anahtarınız varsa, bellek araması otomatik olarak etkinleştirilir.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu hakkında
ayrıntılar için bkz. [Memory Search](/tr/concepts/memory-search).

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve hibrit arama ile
kutudan çıktığı gibi çalışır. Ek bağımlılık gerekmez.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve workspace dışındaki dizinleri
indeksleyebilme yeteneğine sahip local-first sidecar.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çoklu agent farkındalığı ile AI-native
oturumlar arası bellek. Plugin kurulumu.
</Card>
</CardGroup>

## Bilgi wiki katmanı

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar, panolar, köprü modu ve Obsidian uyumlu iş akışlarıyla
kaynak zenginliğine sahip bir wiki kasasına derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce, OpenClaw
aracıya önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur
çalıştırır. Bu varsayılan olarak açıktır -- herhangi bir şeyi yapılandırmanız
gerekmez.

<Tip>
Bellek boşaltma, compaction sırasında bağlam kaybını önler. Aracınızın
konuşmada henüz bir dosyaya yazılmamış önemli gerçekleri varsa, özetleme
gerçekleşmeden önce bunlar otomatik olarak kaydedilir.
</Tip>

## Dreaming (deneysel)

Dreaming, bellek için isteğe bağlı bir arka plan pekiştirme geçişidir. Kısa
vadeli sinyalleri toplar, adayları puanlar ve yalnızca uygun öğeleri uzun
vadeli belleğe (`MEMORY.md`) yükseltir.

Uzun vadeli belleği yüksek sinyalli tutmak için tasarlanmıştır:

- **İsteğe bağlı**: varsayılan olarak devre dışıdır.
- **Zamanlanmış**: etkinleştirildiğinde, `memory-core` bir tam dreaming sweep'i
  için yinelenen bir cron işini otomatik olarak yönetir.
- **Eşikli**: yükseltmelerin puan, geri çağırma sıklığı ve sorgu çeşitliliği
  geçitlerini geçmesi gerekir.
- **İncelenebilir**: aşama özetleri ve günlük girdileri insan incelemesi için
  `DREAMS.md` dosyasına yazılır.

Aşama davranışı, puanlama sinyalleri ve Dream Diary ayrıntıları için bkz.
[Dreaming (experimental)](/tr/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Dizin durumunu ve sağlayıcıyı kontrol edin
openclaw memory search "query"  # Komut satırından arama yapın
openclaw memory index --force   # Dizini yeniden oluşturun
```

## İleri okuma

- [Builtin Memory Engine](/tr/concepts/memory-builtin) -- varsayılan SQLite arka ucu
- [QMD Memory Engine](/tr/concepts/memory-qmd) -- gelişmiş local-first sidecar
- [Honcho Memory](/tr/concepts/memory-honcho) -- AI-native oturumlar arası bellek
- [Memory Wiki](/tr/plugins/memory-wiki) -- derlenmiş bilgi kasası ve wiki'ye özgü araçlar
- [Memory Search](/tr/concepts/memory-search) -- arama işlem hattı, sağlayıcılar ve
  ayarlama
- [Dreaming (experimental)](/tr/concepts/dreaming) -- kısa vadeli geri çağırmadan
  uzun vadeli belleğe arka plan yükseltmesi
- [Bellek yapılandırma başvurusu](/tr/reference/memory-config) -- tüm yapılandırma seçenekleri
- [Compaction](/tr/concepts/compaction) -- compaction'ın bellekle nasıl etkileşime girdiği
