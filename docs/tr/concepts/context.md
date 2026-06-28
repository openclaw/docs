---
read_when:
    - OpenClaw’da “context”in ne anlama geldiğini anlamak istiyorsunuz
    - Modelin bir şeyi neden "bildiğini" (veya unuttuğunu) ayıklıyorsunuz
    - Bağlam ek yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-06-28T00:27:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

"Bağlam", **OpenClaw'un bir çalıştırma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Yeni başlayanlar için zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, skills listesi, zaman/çalışma zamanı ve enjekte edilen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturumdaki mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görüntüler/sesler vb.

Bağlam, "bellek" ile _aynı şey değildir_: bellek diskte saklanabilir ve daha sonra yeniden yüklenebilir; bağlam ise modelin mevcut penceresinin içindekilerdir.

## Hızlı başlangıç (bağlamı inceleme)

- `/status` → hızlı "pencerem ne kadar dolu?" görünümü + oturum ayarları.
- `/context list` → nelerin enjekte edildiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha derin döküm: dosya başına, araç şeması boyutları, skill girdisi boyutları, sistem istemi boyutu ve compact edilebilir döküm mesajı sayıları.
- `/context map` → geçerli oturumun izlenen bağlam katkı sağlayıcılarının WinDirStat tarzı ağaç haritası görüntüsü.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım altbilgisi ekler.
- `/compact` → pencere alanı açmak için eski geçmişi kompakt bir girdide özetler.

Ayrıca bkz.: [Slash komutları](/tr/tools/slash-commands), [Token kullanımı ve maliyetler](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç politikasına ve çalışma alanınızdakilere göre değişir.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

En son önbelleğe alınmış çalıştırma raporundan oluşturulan bir görüntü gönderir. Oturumda normal bir mesaj bir çalıştırma raporu üretmeden önce, `/context map` bir tahmin oluşturmak yerine kullanılamaz mesajı döndürür. Dikdörtgen alanı, izlenen istem karakterleriyle orantılıdır:

- enjekte edilen çalışma alanı dosyaları
- temel sistem istemi metni
- skill istem girdileri
- araç JSON şemaları

`/context list`, `/context detail` ve `/context json`, önbelleğe alınmış çalıştırma raporu olmadığında da isteğe bağlı bir tahmini inceleyebilir.

## Bağlam penceresine neler dahil edilir

Modelin aldığı her şey dahil edilir, örneğin:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/dökümler (görüntüler/sesler/dosyalar).
- Compaction özetleri ve budama artifaktları.
- Sağlayıcı "sarmalayıcıları" veya gizli başlıkları (görünmez, yine de sayılır).

## OpenClaw sistem istemini nasıl oluşturur

Sistem istemi **OpenClaw'a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca meta veri; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı zamanı).
- Çalışma zamanı meta verileri (ana makine/OS/model/düşünme).
- **Proje Bağlamı** altındaki enjekte edilmiş çalışma alanı başlangıç dosyaları.

Tam döküm: [Sistem İstemi](/tr/concepts/system-prompt).

## Enjekte edilen çalışma alanı dosyaları (Proje Bağlamı)

Varsayılan olarak OpenClaw, sabit bir çalışma alanı dosyaları kümesini enjekte eder (varsa):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırma)

Büyük dosyalar, `agents.defaults.bootstrapMaxChars` kullanılarak dosya başına kesilir (varsayılan `20000` karakter). OpenClaw ayrıca `agents.defaults.bootstrapTotalMaxChars` ile dosyalar genelinde toplam başlangıç enjeksiyonu sınırı uygular (varsayılan `60000` karakter). `/context`, **ham ve enjekte edilen** boyutları ve kesme olup olmadığını gösterir.

Kesme gerçekleştiğinde, çalışma zamanı Proje Bağlamı altında istem içine bir uyarı bloğu enjekte edebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `always`).

## Skills: enjekte edilen ve isteğe bağlı yüklenen

Sistem istemi kompakt bir **skills listesi** (ad + açıklama + konum) içerir. Bu listenin gerçek bir ek yükü vardır.

Skill talimatları varsayılan olarak dahil edilmez. Modelin skill'in `SKILL.md` dosyasını **yalnızca gerektiğinde** `read` etmesi beklenir.

## Araçlar: iki maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** ("Araç Kullanımı" olarak gördüğünüz).
2. **Araç şemaları** (JSON). Bunlar, modelin araç çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz de bağlama dahil edilirler.

`/context detail`, neyin baskın olduğunu görebilmeniz için en büyük araç şemalarını ayrıştırır.

## Komutlar, direktifler ve "satır içi kısayollar"

Slash komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` olan bir mesaj komut olarak çalışır.
- **Direktifler**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` model mesajı görmeden önce çıkarılır.
  - Yalnızca direktif içeren mesajlar oturum ayarlarını kalıcı hale getirir.
  - Normal bir mesajdaki satır içi direktifler mesaj başına ipucu görevi görür.
- **Satır içi kısayollar** (yalnızca izin verilen gönderenler): normal bir mesaj içindeki belirli `/...` token'ları hemen çalışabilir (örnek: "hey /status") ve model kalan metni görmeden önce çıkarılır.

Ayrıntılar: [Slash komutları](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (neler kalıcıdır)

Mesajlar arasında nelerin kalıcı olduğu mekanizmaya bağlıdır:

- **Normal geçmiş**, politika tarafından compact edilene/budanana kadar oturum dökümünde kalır.
- **Compaction**, bir özeti döküme kalıcı olarak ekler ve son mesajları olduğu gibi tutar.
- **Budama**, bağlam penceresi alanı açmak için eski araç sonuçlarını _bellekteki_ istemden düşürür, ancak oturum dökümünü yeniden yazmaz; tam geçmiş diskte hâlâ incelenebilir.

Belgeler: [Oturum](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning).

Varsayılan olarak OpenClaw, birleştirme ve compaction için yerleşik `legacy` bağlam motorunu kullanır. `kind: "context-engine"` sağlayan bir Plugin kurar ve `plugins.slots.contextEngine` ile seçerseniz OpenClaw bağlam birleştirmesini, `/compact` işlemini ve ilgili alt ajan bağlam yaşam döngüsü hook'larını bunun yerine o motora devreder. `ownsCompaction: false`, legacy motora otomatik geri dönüş yapmaz; etkin motor yine de `compact()` işlevini doğru şekilde uygulamalıdır. Tam takılabilir arayüz, yaşam döngüsü hook'ları ve yapılandırma için [Bağlam Motoru](/tr/concepts/context-engine) bölümüne bakın.

## `/context` gerçekte ne raporlar

`/context`, varsa en son **çalıştırmada oluşturulmuş** sistem istemi raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcı hale getirilir.
- `System prompt (estimate)` = çalıştırma raporu yoksa (veya raporu oluşturmayan bir CLI arka ucu üzerinden çalışıyorsa) anında hesaplanır.

Her iki durumda da boyutları ve en büyük katkı sağlayıcıları raporlar; tam sistem istemini veya araç şemalarını **dökmez**. Ayrıntılı modda, oturum dökümünü compaction tarafından kullanılan aynı gerçek konuşma mesajı önermesiyle de karşılaştırır; böylece yüksek istem/önbellek kullanımını compact edilebilir konuşma geçmişinden ayırt etmek daha kolay olur.

## İlgili

<CardGroup cols={2}>
  <Card title="Context engine" href="/tr/concepts/context-engine" icon="puzzle-piece">
    Plugin'ler aracılığıyla özel bağlam enjeksiyonu.
  </Card>
  <Card title="Compaction" href="/tr/concepts/compaction" icon="compress">
    Uzun konuşmaları model penceresinin içinde tutmak için özetleme.
  </Card>
  <Card title="System prompt" href="/tr/concepts/system-prompt" icon="message-lines">
    Sistem isteminin nasıl oluşturulduğu ve her turda ne enjekte ettiği.
  </Card>
  <Card title="Agent loop" href="/tr/concepts/agent-loop" icon="arrows-rotate">
    Gelen mesajdan son yanıta kadar tam ajan yürütme döngüsü.
  </Card>
</CardGroup>
