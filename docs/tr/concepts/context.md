---
read_when:
    - OpenClaw’da “bağlam”ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin neden bir şeyi “bildiğini” (veya unuttuğunu) hata ayıklıyorsunuz
    - Bağlam ek yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-04-12T23:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3620db1a8c1956d91a01328966df491388d3a32c4003dc4447197eb34316c77d
    source_path: concepts/context.md
    workflow: 15
---

# Bağlam

“Bağlam”, **OpenClaw’ın bir çalıştırma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Başlangıç seviyesi için zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/çalışma zamanı ve enjekte edilen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturum için mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görüntüler/ses, vb.

Bağlam, “hafıza” ile _aynı şey değildir_: hafıza diskte saklanıp daha sonra yeniden yüklenebilir; bağlam ise modelin mevcut penceresinin içindeki şeydir.

## Hızlı başlangıç (bağlamı inceleme)

- `/status` → penceremin “ne kadar dolu olduğunu” hızlıca gösteren görünüm + oturum ayarları.
- `/context list` → neyin enjekte edildiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha derin döküm: dosya başına, araç şeması boyutları, skill girdisi boyutları ve sistem istemi boyutu.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım altbilgisi ekler.
- `/compact` → pencere alanı boşaltmak için eski geçmişi kompakt bir girdiye özetler.

Ayrıca bakın: [Slash komutları](/tr/tools/slash-commands), [Token kullanımı ve maliyetler](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç ilkesine ve çalışma alanınızda ne olduğuna göre değişir.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
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

## Bağlam penceresine neler dahil olur

Modelin aldığı her şey buna dahildir, şunlar da dahil:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/dökümler (görüntüler/ses/dosyalar).
- Compaction özetleri ve budama artıkları.
- Sağlayıcı “sarmalayıcıları” veya gizli üstbilgiler (görünmezler, yine de sayılırlar).

## OpenClaw sistem istemini nasıl oluşturur

Sistem istemi **OpenClaw’a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca meta veriler; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı saati).
- Çalışma zamanı meta verileri (host/OS/model/düşünme).
- **Project Context** altında enjekte edilen çalışma alanı önyükleme dosyaları.

Tam döküm: [System Prompt](/tr/concepts/system-prompt).

## Enjekte edilen çalışma alanı dosyaları (Project Context)

Varsayılan olarak OpenClaw, sabit bir çalışma alanı dosyaları kümesini enjekte eder (varsa):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırmada)

Büyük dosyalar, `agents.defaults.bootstrapMaxChars` (varsayılan `20000` karakter) kullanılarak dosya başına kırpılır. OpenClaw ayrıca dosyalar genelinde toplam önyükleme enjeksiyonu için `agents.defaults.bootstrapTotalMaxChars` (varsayılan `150000` karakter) ile toplam bir üst sınır uygular. `/context`, **ham ve enjekte edilen** boyutları ve kırpılma olup olmadığını gösterir.

Kırpılma gerçekleştiğinde çalışma zamanı, Project Context altında istem içinde bir uyarı bloğu enjekte edebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `once`).

## Skills: enjekte edilenler ve isteğe bağlı yüklenenler

Sistem istemi kompakt bir **Skills listesi** içerir (ad + açıklama + konum). Bu listenin gerçek bir ek yükü vardır.

Skill talimatları varsayılan olarak _dahil edilmez_. Modelin, yalnızca gerektiğinde skill’in `SKILL.md` dosyasını `read` ile okuması beklenir.

## Araçlar: iki maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** (“Tooling” olarak gördüğünüz şey).
2. **Araç şemaları** (JSON). Bunlar, modelin araçları çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz de bağlama dahil sayılırlar.

`/context detail`, hangilerinin baskın olduğunu görebilmeniz için en büyük araç şemalarını döker.

## Komutlar, yönergeler ve "satır içi kısayollar"

Slash komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` olan bir mesaj komut olarak çalıştırılır.
- **Yönergeler**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue`, model mesajı görmeden önce çıkarılır.
  - Yalnızca yönerge içeren mesajlar oturum ayarlarını kalıcı hale getirir.
  - Normal bir mesaj içindeki satır içi yönergeler, mesaj başına ipuçları olarak davranır.
- **Satır içi kısayollar** (yalnızca izin verilen göndericiler): normal bir mesaj içindeki belirli `/...` belirteçleri hemen çalışabilir (örnek: “hey /status”) ve kalan metin model tarafından görülmeden önce çıkarılır.

Ayrıntılar: [Slash komutları](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (neler kalıcıdır)

Mesajlar arasında neyin kalıcı olduğu, mekanizmaya bağlıdır:

- **Normal geçmiş**, ilkeye göre kompakt hale getirilene/budanana kadar oturum dökümünde kalır.
- **Compaction**, özeti döküme kalıcı olarak ekler ve son mesajları olduğu gibi tutar.
- **Budama**, bir çalıştırma için _bellek içi_ istemden eski araç sonuçlarını kaldırır, ancak dökümü yeniden yazmaz.

Belgeler: [Session](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Session pruning](/tr/concepts/session-pruning).

Varsayılan olarak OpenClaw, derleme ve
Compaction için yerleşik `legacy` bağlam motorunu kullanır. `kind: "context-engine"` sağlayan bir Plugin kurar ve
bunu `plugins.slots.contextEngine` ile seçerseniz, OpenClaw bağlam
derlemesini, `/compact` işlemini ve ilgili alt aracı bağlam yaşam döngüsü kancalarını bunun yerine
o motora devreder. `ownsCompaction: false`, `legacy`
motoruna otomatik geri dönüş sağlamaz; etkin motor yine de `compact()` işlevini doğru şekilde uygulamalıdır. Tam
eklentilenebilir arayüz, yaşam döngüsü kancaları ve yapılandırma için
[Context Engine](/tr/concepts/context-engine) sayfasına bakın.

## `/context` gerçekte neyi raporlar

`/context`, mümkün olduğunda en son **çalıştırma sırasında oluşturulmuş** sistem istemi raporunu tercih eder:

- `System prompt (run)` = araç destekli son çalıştırmadan yakalanıp oturum deposunda kalıcı hale getirilen veri.
- `System prompt (estimate)` = çalıştırma raporu olmadığında (veya raporu üretmeyen bir CLI arka ucu üzerinden çalıştırılırken) anlık olarak hesaplanan veri.

Her iki durumda da boyutları ve en büyük katkı sağlayanları raporlar; tam sistem istemini veya araç şemalarını dökmez.

## İlgili

- [Context Engine](/tr/concepts/context-engine) — Plugin aracılığıyla özel bağlam enjeksiyonu
- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
- [System Prompt](/tr/concepts/system-prompt) — sistem isteminin nasıl oluşturulduğu
- [Agent Loop](/tr/concepts/agent-loop) — tam aracı yürütme döngüsü
