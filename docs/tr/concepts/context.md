---
read_when:
    - OpenClaw'da “bağlam”ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin neden bir şeyi “bildiğini” (veya unuttuğunu) hata ayıklıyorsunuz
    - Bağlam ek yükünü azaltmak istiyorsunuz (`/context`, `/status`, `/compact`)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-04-18T08:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# Bağlam

“Bağlam”, **OpenClaw'un bir çalıştırma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Yeni başlayanlar için zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/çalışma zamanı ve enjekte edilen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturum için sizin mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görseller/sesler vb.

Bağlam, “bellek” ile _aynı şey değildir_: bellek diskte saklanıp daha sonra yeniden yüklenebilir; bağlam ise modelin mevcut penceresinin içindeki şeydir.

## Hızlı başlangıç (bağlamı inceleme)

- `/status` → “pencerem ne kadar dolu?” için hızlı görünüm + oturum ayarları.
- `/context list` → nelerin enjekte edildiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha derin döküm: dosya başına, araç şeması boyutları, skill giriş boyutları ve sistem istemi boyutu.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım altbilgisi ekler.
- `/compact` → pencere alanı açmak için eski geçmişi kompakt bir girdide özetler.

Ayrıca bkz.: [Slash commands](/tr/tools/slash-commands), [Token use & costs](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç politikasına ve çalışma alanınızda neler bulunduğuna göre değişir.

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

## Bağlam penceresine neler dahildir

Modelin aldığı her şey dahildir; buna şunlar da dahildir:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/transkriptler (görseller/sesler/dosyalar).
- Compaction özetleri ve budama yapıtları.
- Sağlayıcı “sarmalayıcıları” veya gizli başlıklar (görünmezler, ama yine de sayılırlar).

## OpenClaw sistem istemini nasıl oluşturur

Sistem istemi **OpenClaw'a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca metadata; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı saati).
- Çalışma zamanı metadata'sı (host/OS/model/düşünme).
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

Büyük dosyalar, dosya başına `agents.defaults.bootstrapMaxChars` kullanılarak kırpılır (varsayılan `12000` karakter). OpenClaw ayrıca dosyalar genelinde toplam bir önyükleme enjeksiyon üst sınırı uygular: `agents.defaults.bootstrapTotalMaxChars` (varsayılan `60000` karakter). `/context`, **ham ve enjekte edilen** boyutları ve kırpma yapılıp yapılmadığını gösterir.

Kırpma olduğunda çalışma zamanı, Project Context altında istem içinde bir uyarı bloğu enjekte edebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `once`).

## Skills: enjekte edilenler ve isteğe bağlı yüklenenler

Sistem istemi, kompakt bir **skills listesi** içerir (ad + açıklama + konum). Bu listenin gerçek bir ek yükü vardır.

Skill yönergeleri varsayılan olarak _dahil edilmez_. Modelin, yalnızca gerektiğinde skill'in `SKILL.md` dosyasını `read` etmesi beklenir.

## Araçlar: iki maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** (“Tooling” olarak gördüğünüz şey).
2. **Araç şemaları** (JSON). Bunlar, modelin araç çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz bile bağlama dahil olurlar.

`/context detail`, en büyük araç şemalarını dökerek hangilerinin baskın olduğunu görmenizi sağlar.

## Komutlar, yönergeler ve "satır içi kısayollar"

Slash komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` içeren bir mesaj komut olarak çalışır.
- **Yönergeler**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` model mesajı görmeden önce ayıklanır.
  - Yalnızca yönerge içeren mesajlar oturum ayarlarını kalıcı hale getirir.
  - Normal bir mesajdaki satır içi yönergeler, mesaj başına ipuçları olarak davranır.
- **Satır içi kısayollar** (yalnızca izin verilen göndericiler): normal bir mesaj içindeki belirli `/...` token'ları hemen çalışabilir (örnek: “hey /status”) ve kalan metin modele gösterilmeden önce ayıklanır.

Ayrıntılar: [Slash commands](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (neler kalıcıdır)

Mesajlar arasında nelerin kalıcı olduğu, mekanizmaya bağlıdır:

- **Normal geçmiş**, politika tarafından compact/prune edilene kadar oturum transkriptinde kalır.
- **Compaction**, özeti transkripte kalıcı olarak yazar ve son mesajları olduğu gibi bırakır.
- **Pruning**, bir çalıştırma için _bellek içi_ istemden eski araç sonuçlarını kaldırır, ancak transkripti yeniden yazmaz.

Belgeler: [Session](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Session pruning](/tr/concepts/session-pruning).

Varsayılan olarak OpenClaw, derleme ve compaction için yerleşik `legacy` bağlam motorunu kullanır. `kind: "context-engine"` sağlayan bir Plugin yüklerseniz ve bunu `plugins.slots.contextEngine` ile seçerseniz, OpenClaw bağlam derlemeyi, `/compact` komutunu ve ilgili alt aracı bağlam yaşam döngüsü kancalarını bunun yerine o motora devreder. `ownsCompaction: false`, otomatik olarak legacy motora geri dönüş yapmaz; etkin motor yine de `compact()` işlevini doğru şekilde uygulamalıdır. Tam takılabilir arayüz, yaşam döngüsü kancaları ve yapılandırma için [Context Engine](/tr/concepts/context-engine) sayfasına bakın.

## `/context` gerçekte neyi raporlar

`/context`, mümkün olduğunda en son **çalıştırmada oluşturulmuş** sistem istemi raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcı olarak saklanır.
- `System prompt (estimate)` = çalıştırma raporu yoksa (veya rapor üretmeyen bir CLI arka ucu üzerinden çalışıyorsa) anlık olarak hesaplanır.

Her iki durumda da boyutları ve en büyük katkıda bulunanları raporlar; tam sistem istemini veya araç şemalarını dökmez.

## İlgili

- [Context Engine](/tr/concepts/context-engine) — Plugin'ler aracılığıyla özel bağlam enjeksiyonu
- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
- [System Prompt](/tr/concepts/system-prompt) — sistem isteminin nasıl oluşturulduğu
- [Agent Loop](/tr/concepts/agent-loop) — tam aracı yürütme döngüsü
