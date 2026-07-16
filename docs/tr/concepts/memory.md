---
read_when:
    - Belleğin nasıl çalıştığını anlamak istiyorsunuz
    - Hangi bellek dosyalarının yazılacağını öğrenmek istiyorsunuz
summary: OpenClaw oturumlar arasında bilgileri nasıl hatırlar
title: Belleğe genel bakış
x-i18n:
    generated_at: "2026-07-16T16:55:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw, aracınızın çalışma alanına (varsayılan `~/.openclaw/workspace`) düz Markdown dosyaları yazarak bilgileri hatırlar. Model yalnızca diske kaydedilenleri hatırlar; gizli bir durum yoktur.

## Nasıl çalışır

Aracınızın bellekle ilgili üç dosyası vardır:

- **`MEMORY.md`** — uzun süreli bellek. Kalıcı olgular, tercihler ve
  kararlar. Oturumun başında yüklenir.
- **`memory/YYYY-MM-DD.md`** (veya `memory/YYYY-MM-DD-<slug>.md`) — günlük notlar.
  Devam eden bağlam ve gözlemler. Yalnızca `/new` veya `/reset` içeren
  bir başlangıçta bugünün ve dünün tarihli notları otomatik olarak yüklenir;
  paketle birlikte gelen oturum belleği kancası tarafından yazılanlar gibi kısa
  ad eklenmiş çeşitler de yalnızca tarih içeren dosyayla birlikte alınır.
- **`DREAMS.md`** (isteğe bağlı) — insanların incelemesi için Dream Diary ve
  Dreaming taraması özetleri; dayanaklı geçmişe dönük doldurma girdilerini de içerir.

<Tip>
Aracınızın bir şeyi hatırlamasını istiyorsanız ona söylemeniz yeterlidir:
"TypeScript'i tercih ettiğimi hatırla." Notu uygun dosyaya yazar.
</Tip>

## Nereye ne yazılır

`MEMORY.md`, kompakt ve özenle düzenlenmiş katmandır: kalıcı olgular, tercihler,
süregelen kararlar ve oturumun başında erişilebilir olması gereken kısa
özetler. Ham döküm, günlük kayıt veya kapsamlı arşiv değildir.

`memory/YYYY-MM-DD.md` dosyaları çalışma katmanıdır: ayrıntılı günlük notlar,
gözlemler, oturum özetleri ve daha sonra hâlâ yararlı olabilecek ham bağlam.
Bunlar `memory_search` ve `memory_get` için dizine eklenir ancak her
turda başlangıç istemine eklenmez.

Araç zaman içinde günlük notlardaki yararlı materyalleri `MEMORY.md`
içinde özetler ve güncelliğini yitirmiş uzun süreli girdileri kaldırır.
Oluşturulan çalışma alanı talimatları ve Heartbeat akışı bunu düzenli olarak
yapar; her ayrıntı için `MEMORY.md` dosyasını elle düzenlemeniz gerekmez.

`MEMORY.md` başlangıç dosyası bütçesini aşarsa OpenClaw diskteki dosyayı
değiştirmeden korur ancak bağlama eklenen kopyayı kısaltır. Bunu, ayrıntılı
materyali `memory/*.md` içine taşımanız, `MEMORY.md` içinde yalnızca
kalıcı bir özet tutmanız veya daha fazla istem bütçesi harcamak istiyorsanız
başlangıç sınırlarını yükseltmeniz gerektiğini belirten bir sinyal olarak
değerlendirin. Ham ve eklenen boyutları ve kısaltma durumunu görmek için
`/context list`, `/context detail` veya `openclaw doctor` kullanın.

## Kodlama yardımcılarından içe aktarma

Control UI, Codex ve Claude Code'daki mevcut yerel belleği içe aktarabilir.
**Settings** → **Import Memory** öğesini açın, hedef aracı seçin, algılanan
dosyaları inceleyin ve içe aktarmayı onaylayın. OpenClaw yalnızca Markdown
belleğini kopyalar:

- Codex: `~/.codex/memories` (veya `CODEX_HOME/memories`) altındaki
  birleştirilmiş `MEMORY.md` ve `memory_summary.md` dosyaları. Ham yürütme
  ve döküm dosyaları içe aktarılmaz.
- Claude Code: her projenin `~/.claude/projects/*/memory` altındaki otomatik bellek
  dizininden Markdown dosyaları ve mevcut olduğunda kullanıcı tarafından
  yapılandırılmış `autoMemoryDirectory`. Proje talimatları, oturumlar, ayarlar ve
  kimlik bilgileri yalnızca belleğe yönelik bu işlemin parçası değildir.

İçe aktarılan dosyalar, seçilen araç çalışma alanında `memory/imports/codex/` ve
`memory/imports/claude-code/` altında ayrı kalır. `memory_search` için dizine eklenir
ve `memory_get` aracılığıyla kullanılabilir; aracın başlangıç
`MEMORY.md` dosyasıyla birleştirilmez. Kaynak dosyalar değiştirilmez.

Önizleme, hedef çakışmalarını işaretler. Bu dosyaları değiştirmek için
**Replace existing imports** seçeneğini etkinleştirin; uygulama işlemi,
doğrulanmış bir içe aktarma öncesi yedeği oluşturur ve üzerine yazılan
dosyaların öğe düzeyindeki kopyalarını geçiş raporunda korur.

## Eyleme duyarlı anılar

Çoğu anı sıradan Markdown notlarıdır. Bazıları aracın daha sonra ne yapması
gerektiğini etkiler; bunlar için yalnızca olguyu değil, nota göre ne zaman
harekete geçmenin güvenli olduğunu da kaydedin.

Bir not aşağıdakileri içerdiğinde bu eylem sınırını kaydedin:

- onay veya izin gereksinimleri,
- geçici kısıtlamalar,
- başka bir oturuma, konu dizisine veya kişiye devirler,
- sona erme koşulları,
- harekete geçmenin güvenli olduğu zamanlama,
- kaynak veya sahip yetkisi,
- cazip bir eylemden kaçınma talimatları.

Yararlı bir eyleme duyarlı anı şunları açıkça belirtir:

- gelecekteki davranışı neyin değiştirdiği,
- ne zaman veya hangi koşul altında geçerli olduğu,
- ne zaman sona erdiği veya eylemin kilidini neyin açtığı,
- aracın neyi yapmaktan kaçınması gerektiği,
- güveni veya yetkiyi etkiliyorsa kaynağın ya da sahibin kim olduğu.

Bellek, onay bağlamını koruyabilir ancak politikayı uygulamaz. Sıkı
operasyonel kontroller için OpenClaw onay ayarlarını, korumalı alan kullanımını
ve zamanlanmış görevleri kullanın.

Örnek:

```md
API geçişi başka bir oturumda tasarlanıyor. Gelecekteki turlar bu konu
dizisinden API uygulamasını düzenlememeli; geçiş planı tamamlanana kadar
buradaki bulguları yalnızca tasarım girdisi olarak kullanmalıdır.
```

Başka bir örnek:

```md
Güvenilmeyen bir kaynaktan gelen rapor, öne çıkarılmadan önce incelenmelidir.
Gelecekteki turlar bunu yalnızca kanıt olarak değerlendirmeli; güvenilir bir
incelemeci içeriği doğrulayana kadar kalıcı bellek olarak saklamamalıdır.
```

Bu, her anı için zorunlu bir şema değildir; basit olgular kısa tutulabilir.
Zamanlama, yetki, sona erme veya harekete geçme güvenliği bağlamının kaybı
aracın daha sonra yanlış bir şey yapmasına neden olabilecekse eyleme duyarlı
sınırlar kullanın.

Çıkarımsal, kısa ömürlü takipler için [taahhütleri](/tr/concepts/commitments)
kullanın. Kesin hatırlatmalar, zamanlanmış kontroller ve yinelenen işler için
[zamanlanmış görevleri](/tr/automation/cron-jobs) kullanın. Bellek, her iki yolun
çevresindeki kalıcı bağlamı yine de özetleyebilir.

## Çıkarımsal taahhütler

Gelecekteki bazı takipler kalıcı olgular değildir. Yarın bir mülakattan söz
ederseniz yararlı anı, "bunu sonsuza kadar `MEMORY.md` içinde sakla"
değil, "mülakattan sonra durumunu sor" olabilir.

[Taahhütler](/tr/concepts/commitments), bu durum için isteğe bağlı, kısa ömürlü
takip anılarıdır. OpenClaw bunları gizli bir arka plan geçişinde çıkarır,
aynı araç ve kanalla sınırlar ve zamanı gelen durum sormaları Heartbeat
üzerinden iletir. Açık hatırlatmalar için yine
[zamanlanmış görevler](/tr/automation/cron-jobs) kullanılır.

## Bellek araçları

Aracın bellekle çalışmak için iki aracı vardır:

- **`memory_search`** — ifade biçimi özgün metinden farklı olsa bile anlamsal
  aramayı kullanarak ilgili notları bulur.
- **`memory_get`** — belirli bir bellek dosyasını veya satır aralığını okur.

Her iki araç da etkin bellek Plugin'i tarafından sağlanır (varsayılan:
`memory-core`).

## Bellek araması

Bir gömme sağlayıcısı yapılandırıldığında `memory_search`, hibrit arama
kullanır: vektör benzerliği (anlamsal anlam) ile anahtar sözcük eşleştirmesini
(ID'ler ve kod sembolleri gibi tam terimler) birleştirir. Bu, desteklenen
herhangi bir sağlayıcının API anahtarıyla kullanıma hazır olarak çalışır.

<Info>
OpenClaw varsayılan olarak OpenAI gömmelerini kullanır. Gemini, Voyage,
Mistral, Bedrock, DeepInfra, yerel GGUF, Ollama, LM Studio, GitHub Copilot veya
OpenAI uyumlu genel bir uç nokta kullanmak için `agents.defaults.memorySearch.provider` değerini
açıkça ayarlayın.
</Info>

Aramanın nasıl çalıştığı, ayarlama seçenekleri ve sağlayıcı kurulumu için
[Bellek araması](/tr/concepts/memory-search) bölümüne bakın.

## Bellek arka uçları

<CardGroup cols={3}>
<Card title="Yerleşik (varsayılan)" icon="database" href="/tr/concepts/memory-builtin">
SQLite tabanlıdır. Anahtar sözcük araması, vektör benzerliği ve hibrit aramayla
kullanıma hazır olarak çalışır. Ek bağımlılık gerektirmez.
</Card>
<Card title="QMD" icon="search" href="/tr/concepts/memory-qmd">
Yeniden sıralama, sorgu genişletme ve çalışma alanı dışındaki dizinleri dizine
ekleme özelliğine sahip, yerel öncelikli yardımcı süreç.
</Card>
<Card title="Honcho" icon="brain" href="/tr/concepts/memory-honcho">
Kullanıcı modelleme, anlamsal arama ve çoklu araç farkındalığı özelliklerine
sahip, yapay zekâya özgü oturumlar arası bellek. Plugin kurulumu gerekir.
</Card>
<Card title="LanceDB" icon="layers" href="/tr/plugins/memory-lancedb">
OpenAI uyumlu gömmeler, otomatik hatırlama, otomatik yakalama ve yerel Ollama
gömme desteğine sahip LanceDB tabanlı bellek. Plugin kurulumu gerekir.
</Card>
</CardGroup>

## Bilgi vikisi katmanı

Kalıcı belleğin ham notlardan ziyade bakımı yapılan bir bilgi tabanı gibi
davranmasını istiyorsanız paketle birlikte gelen `memory-wiki` Plugin'ini
kullanın. Kalıcı bilgiyi; deterministik sayfa yapısı, yapılandırılmış iddialar
ve kanıtlar, çelişki ve güncellik takibi, oluşturulan panolar, derlenmiş özetler
ve vikiye özgü araçlarla (`wiki_status`, `wiki_search`,
`wiki_get`, `wiki_apply`, `wiki_lint`) bir viki kasasında
derler.

`memory-wiki`, etkin bellek Plugin'inin yerini almaz; hatırlama, öne
çıkarma ve Dreaming yine etkin bellek Plugin'ine aittir. `memory-wiki`
bunun yanına kaynak kökeni bakımından zengin bir bilgi katmanı ekler.

<CardGroup cols={1}>
<Card title="Bellek Vikisi" icon="book" href="/tr/plugins/memory-wiki">
Kalıcı belleği iddialar, panolar, köprü modu ve Obsidian dostu iş akışlarıyla
kaynak kökeni bakımından zengin bir viki kasasında derler.
</Card>
</CardGroup>

## Otomatik bellek boşaltma

[Compaction](/tr/concepts/compaction) konuşmanızı özetlemeden önce OpenClaw,
araca önemli bağlamı bellek dosyalarına kaydetmesini hatırlatan sessiz bir tur
çalıştırır. Bu varsayılan olarak açıktır; kapatmak için
`agents.defaults.compaction.memoryFlush.enabled: false` değerini ayarlayın.

Bu bakım turunu yerel bir modelde tutmak için yalnızca bellek boşaltma turuna
uygulanan kesin bir geçersiz kılma ayarlayın (etkin oturumun model yedek
zincirini devralmaz):

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
Bellek boşaltma, Compaction sırasında bağlam kaybını önler. Aracınızın
konuşmada henüz bir dosyaya yazılmamış önemli olguları varsa özetleme
gerçekleşmeden önce bunlar otomatik olarak kaydedilir.
</Tip>

## Dreaming

Dreaming, bellek için isteğe bağlı bir arka plan birleştirme geçişidir. Kısa
süreli hatırlama sinyallerini toplar, adayları puanlar ve yalnızca yeterli
nitelikteki öğeleri uzun süreli belleğe (`MEMORY.md`) yükseltir:

- **İsteğe bağlı**: varsayılan olarak devre dışıdır.
- **Zamanlanmış**: etkinleştirildiğinde `memory-core`, tam bir Dreaming taraması
  için yinelenen bir Cron işini otomatik olarak yönetir.
- **Eşikli**: yükseltmeler puan, hatırlama sıklığı ve sorgu çeşitliliği
  eşiklerini aşmalıdır.
- **İncelenebilir**: aşama özetleri ve günlük girdileri insanların incelemesi için
  `DREAMS.md` içine yazılır.

Aşama davranışı, puanlama sinyalleri ve Dream Diary ayrıntıları için
[Dreaming](/tr/concepts/dreaming) bölümüne bakın.

## Dayanaklı geçmişe dönük doldurma ve canlı yükseltme

Dreaming sisteminde birbiriyle ilişkili iki inceleme hattı vardır:

- **Canlı Dreaming**, `memory/.dreams/` altındaki kısa süreli Dreaming
  deposundan çalışır ve normal derin aşamanın nelerin `MEMORY.md`
  içine yükseleceğine karar vermek için kullandığı yöntemdir.
- **Dayanaklı geçmişe dönük doldurma**, geçmiş `memory/YYYY-MM-DD.md` notlarını
  bağımsız günlük dosyaları olarak okur ve yapılandırılmış inceleme çıktısını
  `DREAMS.md` içine yazar.

Dayanaklı geçmişe dönük doldurma, eski notları yeniden oynatmak ve
`MEMORY.md` dosyasını elle düzenlemeden sistemin neleri kalıcı kabul
ettiğini incelemek için yararlıdır.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` bayrağı, dayanaklı kalıcı adayları normal derin aşamanın
zaten kullandığı aynı kısa süreli Dreaming deposuna hazırlar; bunları doğrudan
yükseltmez. Dolayısıyla:

- `DREAMS.md`, insanların inceleme yüzeyi olarak kalır.
- Kısa süreli depo, makineye yönelik sıralama yüzeyi olarak kalır.
- `MEMORY.md` yine yalnızca derin yükseltme tarafından yazılır.

Sıradan günlük girdilerine veya normal hatırlama durumuna dokunmadan bir
yeniden oynatmayı geri almak için:

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
- [Honcho belleği](/tr/concepts/memory-honcho): yapay zekâya özgü, oturumlar arası bellek.
- [Memory LanceDB](/tr/plugins/memory-lancedb): OpenAI uyumlu gömmelere sahip, LanceDB destekli plugin.
- [Memory Wiki](/tr/plugins/memory-wiki): derlenmiş bilgi kasası ve wiki'ye özgü araçlar.
- [Dreaming](/tr/concepts/dreaming): kısa süreli hatırlamadan uzun süreli belleğe arka planda yükseltme.
- [Bellek yapılandırması başvurusu](/tr/reference/memory-config): tüm yapılandırma ayarları.
- [Compaction](/tr/concepts/compaction): Compaction'ın bellekle nasıl etkileşime girdiği.
- [Etkin bellek](/tr/concepts/active-memory): etkileşimli sohbet oturumları için alt ajan belleği.
