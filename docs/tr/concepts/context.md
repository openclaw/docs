---
read_when:
    - OpenClaw'da "bağlam"ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin bir şeyi neden "bildiğini" (veya unuttuğunu) hata ayıklayarak inceliyorsunuz
    - Bağlam ek yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-05-10T19:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

"Context", **OpenClaw'ın bir çalıştırma için modele gönderdiği her şeydir**. Modelin **context window**'u (token sınırı) tarafından sınırlandırılır.

Yeni başlayanlar için zihinsel model:

- **System prompt** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/runtime ve enjekte edilen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturum için sizin mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görüntüler/ses, vb.

Context, "memory" ile _aynı şey değildir_: memory diskte saklanıp daha sonra yeniden yüklenebilir; context ise modelin mevcut penceresinin içinde olan şeydir.

## Hızlı başlangıç (context'i inceleme)

- `/status` → hızlı "pencerem ne kadar dolu?" görünümü + oturum ayarları.
- `/context list` → nelerin enjekte edildiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha derin döküm: dosya başına, araç şeması boyutları başına, Skill girdisi boyutları başına ve system prompt boyutu.
- `/context map` → mevcut oturumun izlenen context katkıda bulunanlarının WinDirStat tarzı ağaç haritası görüntüsü.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım alt bilgisini ekle.
- `/compact` → pencere alanı açmak için eski geçmişi kompakt bir girdiye özetle.

Ayrıca bkz.: [Eğik çizgi komutları](/tr/tools/slash-commands), [Token kullanımı ve maliyetler](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç politikasına ve çalışma alanınızda ne olduğuna göre değişir.

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

En son önbelleğe alınmış çalıştırma raporundan oluşturulan bir görüntü gönderir. Oturumda normal bir mesaj bir çalıştırma raporu üretmeden önce, `/context map` tahmin render etmek yerine kullanılamaz mesajı döndürür. Dikdörtgen alanı, izlenen prompt karakterleriyle orantılıdır:

- enjekte edilen çalışma alanı dosyaları
- temel system prompt metni
- Skill prompt girdileri
- araç JSON şemaları

`/context list`, `/context detail` ve `/context json`, önbelleğe alınmış çalıştırma raporu olmadığında da isteğe bağlı bir tahmini inceleyebilir.

## Context window'a neler dahil edilir

Modelin aldığı her şey dahil edilir, bunlar dahil:

- System prompt (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/transkriptler (görüntüler/ses/dosyalar).
- Compaction özetleri ve budama artefaktları.
- Sağlayıcı "sarmalayıcıları" veya gizli başlıkları (görünmez, yine de sayılır).

## OpenClaw system prompt'u nasıl oluşturur

System prompt **OpenClaw'a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca metadata; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı zamanı).
- Runtime metadata'sı (host/OS/model/thinking).
- **Project Context** altında enjekte edilen çalışma alanı bootstrap dosyaları.

Tam döküm: [System Prompt](/tr/concepts/system-prompt).

## Enjekte edilen çalışma alanı dosyaları (Project Context)

Varsayılan olarak, OpenClaw sabit bir çalışma alanı dosyaları kümesini (varsa) enjekte eder:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırma)

Büyük dosyalar, `agents.defaults.bootstrapMaxChars` kullanılarak dosya başına kırpılır (varsayılan `12000` karakter). OpenClaw ayrıca `agents.defaults.bootstrapTotalMaxChars` ile dosyalar genelinde toplam bootstrap enjeksiyon sınırı uygular (varsayılan `60000` karakter). `/context`, **ham ve enjekte edilen** boyutları ve kırpma olup olmadığını gösterir.

Kırpma gerçekleştiğinde runtime, Project Context altında prompt içinde bir uyarı bloğu enjekte edebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `once`).

## Skills: enjekte edilen ve isteğe bağlı yüklenen

System prompt kompakt bir **Skills listesi** içerir (ad + açıklama + konum). Bu listenin gerçek bir ek yükü vardır.

Skill talimatları varsayılan olarak dahil edilmez. Modelin Skill'in `SKILL.md` dosyasını **yalnızca gerektiğinde** `read` etmesi beklenir.

## Araçlar: iki maliyet vardır

Araçlar context'i iki şekilde etkiler:

1. System prompt içindeki **araç listesi metni** ("Tooling" olarak gördüğünüz şey).
2. **Araç şemaları** (JSON). Bunlar, modelin araçları çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz bile context'e dahil edilirler.

`/context detail`, en büyük araç şemalarını dökümler; böylece neyin baskın olduğunu görebilirsiniz.

## Komutlar, yönergeler ve "satır içi kısayollar"

Eğik çizgi komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` olan bir mesaj komut olarak çalışır.
- **Yönergeler**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` model mesajı görmeden önce çıkarılır.
  - Yalnızca yönerge içeren mesajlar oturum ayarlarını kalıcı hale getirir.
  - Normal bir mesajdaki satır içi yönergeler, mesaj başına ipuçları gibi davranır.
- **Satır içi kısayollar** (yalnızca izin verilen göndericiler): normal bir mesaj içindeki belirli `/...` token'ları hemen çalışabilir (örnek: "hey /status") ve model kalan metni görmeden önce çıkarılır.

Ayrıntılar: [Eğik çizgi komutları](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (ne kalıcı olur)

Mesajlar arasında neyin kalıcı olduğu mekanizmaya bağlıdır:

- **Normal geçmiş**, politika tarafından compact/prune edilene kadar oturum transkriptinde kalıcı olur.
- **Compaction**, transkripte bir özet kalıcılaştırır ve son mesajları olduğu gibi tutar.
- **Budama**, context-window alanı açmak için eski araç sonuçlarını _bellekteki_ prompt'tan düşürür, ancak oturum transkriptini yeniden yazmaz - tam geçmiş diskte hâlâ incelenebilir.

Belgeler: [Oturum](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning).

Varsayılan olarak OpenClaw, birleştirme ve Compaction için yerleşik `legacy` context engine'i kullanır. `kind: "context-engine"` sağlayan bir Plugin yüklerseniz ve `plugins.slots.contextEngine` ile seçerseniz OpenClaw bunun yerine context birleştirmeyi, `/compact` komutunu ve ilgili subagent context yaşam döngüsü hook'larını o engine'e devreder. `ownsCompaction: false`, legacy engine'e otomatik geri dönüş yapmaz; etkin engine yine de `compact()` öğesini doğru şekilde uygulamalıdır. Tam takılabilir arayüz, yaşam döngüsü hook'ları ve yapılandırma için [Context Engine](/tr/concepts/context-engine) bölümüne bakın.

## `/context` gerçekte ne raporlar

`/context`, mevcut olduğunda en son **çalıştırmada oluşturulmuş** system prompt raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcılaştırılır.
- `System prompt (estimate)` = çalıştırma raporu olmadığında (veya raporu üretmeyen bir CLI backend'i üzerinden çalışırken) anında hesaplanır.

Her iki durumda da boyutları ve en büyük katkıda bulunanları raporlar; tam system prompt'u veya araç şemalarını **dökmez**.

## İlgili

<CardGroup cols={2}>
  <Card title="Context engine" href="/tr/concepts/context-engine" icon="puzzle-piece">
    Plugin'ler aracılığıyla özel context enjeksiyonu.
  </Card>
  <Card title="Compaction" href="/tr/concepts/compaction" icon="compress">
    Uzun konuşmaları model penceresinin içinde tutmak için özetleme.
  </Card>
  <Card title="System prompt" href="/tr/concepts/system-prompt" icon="message-lines">
    System prompt'un nasıl oluşturulduğu ve her turda ne enjekte ettiği.
  </Card>
  <Card title="Agent döngüsü" href="/tr/concepts/agent-loop" icon="arrows-rotate">
    Gelen mesajdan son yanıta kadar tam agent yürütme döngüsü.
  </Card>
</CardGroup>
