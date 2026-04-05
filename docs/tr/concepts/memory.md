---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarına yazılması gerektiğini bilmek istiyorsunuz
summary: OpenClaw’ın oturumlar arasında şeyleri nasıl hatırladığı
title: Memory Overview
x-i18n:
    generated_at: "2026-04-05T13:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Memory Overview

OpenClaw, aracınızın çalışma alanına **düz Markdown dosyaları** yazarak bir şeyleri hatırlar. Model yalnızca diske kaydedilenleri "hatırlar" -- gizli bir durum yoktur.

## Nasıl çalışır

Aracınızın anıları depolamak için iki yeri vardır:

- **`MEMORY.md`** -- uzun süreli bellek. Kalıcı gerçekler, tercihler ve
  kararlar. Her DM oturumunun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** -- günlük notlar. Devam eden bağlam ve gözlemler.
  Bugünün ve dünkü notlar otomatik olarak yüklenir.

Bu dosyalar aracının çalışma alanında bulunur (varsayılan `~/.openclaw/workspace`).

<Tip>
Aracınızın bir şeyi hatırlamasını istiyorsanız ona söylemeniz yeterlidir: "TypeScript tercih ettiğimi hatırla." Bunu uygun dosyaya yazar.
</Tip>

## Bellek araçları

Aracının bellekle çalışmak için iki aracı vardır:

- **`memory_search`** -- özgün ifadeden farklı olsa bile anlam tabanlı arama kullanarak ilgili notları bulur.
- **`memory_get`** -- belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da etkin bellek plugin’i tarafından sağlanır (varsayılan: `memory-core`).

## Bellek araması

Bir embedding sağlayıcısı yapılandırıldığında `memory_search`, **hibrit
arama** kullanır -- vektör benzerliğini (anlamsal anlam) anahtar sözcük eşleştirmesiyle
(kimlikler ve kod sembolleri gibi tam terimler) birleştirir. Desteklenen herhangi bir sağlayıcı için bir API key’iniz olduğunda bu kutudan çıktığı gibi çalışır.

<Info>
OpenClaw, kullanılabilir API key’lerden embedding sağlayıcınızı otomatik algılar. OpenAI, Gemini, Voyage veya Mistral anahtarınız yapılandırılmışsa bellek araması otomatik olarak etkinleştirilir.
</Info>

Aramanın nasıl çalıştığı, ayar seçenekleri ve sağlayıcı kurulumu hakkında ayrıntılar için bkz.
[Memory Search](/concepts/memory-search).

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve hibrit arama ile kutudan çıktığı gibi çalışır. Ek bağımlılık yoktur.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki dizinleri dizine ekleme yeteneğine sahip local-first yan hizmet.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çoklu aracı farkındalığı ile AI-native oturumlar arası bellek. Plugin kurulumu.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw,
aracıya önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur
çalıştırır. Bu varsayılan olarak açıktır -- herhangi bir şey yapılandırmanız gerekmez.

<Tip>
Bellek boşaltma, compaction sırasında bağlam kaybını önler. Aracınızın konuşmada henüz bir dosyaya yazılmamış önemli gerçekleri varsa, özetleme gerçekleşmeden önce bunlar otomatik olarak kaydedilir.
</Tip>

## Dreaming (deneysel)

Dreaming, bellek için isteğe bağlı bir arka plan sağlamlaştırma geçişidir. Günlük dosyalarındaki (`memory/YYYY-MM-DD.md`) kısa süreli hatırlamaları yeniden gözden geçirir, puanlar ve yalnızca uygun öğeleri uzun süreli belleğe (`MEMORY.md`) yükseltir.

Uzun süreli belleği yüksek sinyalli tutmak için tasarlanmıştır:

- **İsteğe bağlı katılım**: varsayılan olarak kapalıdır.
- **Zamanlanmış**: etkinleştirildiğinde, `memory-core` yinelenen görevi otomatik olarak yönetir.
- **Eşikli**: yükseltmeler puan, hatırlama sıklığı ve sorgu çeşitliliği kapılarını geçmelidir.

Mod davranışı (`off`, `core`, `rem`, `deep`), puanlama sinyalleri ve ayar düğmeleri için bkz. [Dreaming (experimental)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Dizin durumunu ve sağlayıcıyı kontrol et
openclaw memory search "query"  # Komut satırından ara
openclaw memory index --force   # Dizini yeniden oluştur
```

## Daha fazla bilgi

- [Builtin Memory Engine](/concepts/memory-builtin) -- varsayılan SQLite arka ucu
- [QMD Memory Engine](/concepts/memory-qmd) -- gelişmiş local-first yan hizmet
- [Honcho Memory](/concepts/memory-honcho) -- AI-native oturumlar arası bellek
- [Memory Search](/concepts/memory-search) -- arama işlem hattı, sağlayıcılar ve
  ayarlar
- [Dreaming (experimental)](/concepts/memory-dreaming) -- kısa süreli hatırlamadan
  uzun süreli belleğe arka plan yükseltme
- [Memory configuration reference](/reference/memory-config) -- tüm yapılandırma düğmeleri
- [Compaction](/concepts/compaction) -- compaction’ın bellekle nasıl etkileştiği
