---
read_when:
    - OpenClaw'da "bağlam"ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin bir şeyi neden "bildiğini" (veya neden unuttuğunu) araştırıyorsunuz
    - Bağlam ek yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-05-06T09:07:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

"Bağlam", **OpenClaw'ın bir çalışma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Yeni başlayanlar için zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/çalışma zamanı ve enjekte edilen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturumdaki mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görseller/ses, vb.

Bağlam, "memory" ile _aynı şey değildir_: memory diskte saklanıp daha sonra yeniden yüklenebilir; bağlam ise modelin mevcut penceresinin içindeki şeydir.

## Hızlı başlangıç (bağlamı inceleme)

- `/status` → hızlı "pencerem ne kadar dolu?" görünümü + oturum ayarları.
- `/context list` → nelerin enjekte edildiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha derin döküm: dosya başına, araç şeması boyutları başına, Skills girdisi boyutları başına ve sistem istemi boyutu.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım alt bilgisi ekler.
- `/compact` → pencere alanı açmak için eski geçmişi kompakt bir girdide özetler.

Ayrıca bkz.: [Slash commands](/tr/tools/slash-commands), [Token kullanımı ve maliyetler](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç politikasına ve çalışma alanınızda neler olduğuna göre değişir.

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

## Bağlam penceresine neler dahil edilir?

Modelin aldığı her şey dahil edilir, örneğin:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/transkriptler (görseller/ses/dosyalar).
- Compaction özetleri ve budama artefaktları.
- Sağlayıcı "sarmalayıcıları" veya gizli başlıklar (görünmez, yine de sayılır).

## OpenClaw sistem istemini nasıl oluşturur?

Sistem istemi **OpenClaw'a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca metadata; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı zamanı).
- Çalışma zamanı metadata'sı (host/OS/model/thinking).
- **Project Context** altında enjekte edilen çalışma alanı bootstrap dosyaları.

Tam döküm: [Sistem İstemi](/tr/concepts/system-prompt).

## Enjekte edilen çalışma alanı dosyaları (Project Context)

Varsayılan olarak OpenClaw, mevcutsa sabit bir çalışma alanı dosyaları kümesini enjekte eder:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırma)

Büyük dosyalar, `agents.defaults.bootstrapMaxChars` kullanılarak dosya başına kırpılır (varsayılan `12000` karakter). OpenClaw ayrıca `agents.defaults.bootstrapTotalMaxChars` ile dosyalar genelinde toplam bootstrap enjeksiyonu sınırı uygular (varsayılan `60000` karakter). `/context`, **ham ve enjekte edilen** boyutları ve kırpma olup olmadığını gösterir.

Kırpma gerçekleştiğinde çalışma zamanı, Project Context altında istem içine bir uyarı bloğu enjekte edebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `once`).

## Skills: enjekte edilen ve ihtiyaç halinde yüklenen

Sistem istemi, kompakt bir **Skills listesi** (ad + açıklama + konum) içerir. Bu listenin gerçek bir maliyeti vardır.

Skill yönergeleri varsayılan olarak dahil edilmez. Modelin, skill'in `SKILL.md` dosyasını **yalnızca gerektiğinde** `read` etmesi beklenir.

## Araçlar: iki maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** ("Tooling" olarak gördüğünüz şey).
2. **Araç şemaları** (JSON). Bunlar, modelin araçları çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz bile bağlama dahil edilirler.

`/context detail`, en büyük araç şemalarını döker; böylece neyin baskın olduğunu görebilirsiniz.

## Komutlar, direktifler ve "satır içi kısayollar"

Slash commands Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` içeren bir mesaj komut olarak çalışır.
- **Direktifler**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` model mesajı görmeden önce çıkarılır.
  - Yalnızca direktif içeren mesajlar oturum ayarlarını kalıcılaştırır.
  - Normal bir mesajdaki satır içi direktifler, mesaj başına ipuçları gibi davranır.
- **Satır içi kısayollar** (yalnızca izin verilen gönderenler): normal bir mesaj içindeki belirli `/...` token'ları hemen çalışabilir (örnek: "hey /status") ve model kalan metni görmeden önce çıkarılır.

Ayrıntılar: [Slash commands](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (neler kalıcıdır)

Mesajlar arasında nelerin kalıcı olduğu mekanizmaya bağlıdır:

- **Normal geçmiş**, politika tarafından compact edilene/budanana kadar oturum transkriptinde kalıcıdır.
- **Compaction**, transkripte bir özet kaydeder ve son mesajları olduğu gibi tutar.
- **Budama**, bağlam penceresinde alan açmak için eski araç sonuçlarını _bellek içi_ istemden düşürür, ancak oturum transkriptini yeniden yazmaz - tam geçmiş diskte hâlâ incelenebilir.

Belgeler: [Oturum](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning).

Varsayılan olarak OpenClaw, birleştirme ve Compaction için yerleşik `legacy` bağlam motorunu kullanır. `kind: "context-engine"` sağlayan bir Plugin kurup onu `plugins.slots.contextEngine` ile seçerseniz OpenClaw bunun yerine bağlam birleştirmeyi, `/compact` komutunu ve ilgili alt ajan bağlam yaşam döngüsü hook'larını bu motora devreder. `ownsCompaction: false`, eski motora otomatik geri dönüş yapmaz; etkin motor yine de `compact()` işlevini doğru uygulamalıdır. Tam takılabilir arayüz, yaşam döngüsü hook'ları ve yapılandırma için [Bağlam Motoru](/tr/concepts/context-engine) bölümüne bakın.

## `/context` gerçekte ne raporlar?

`/context`, mevcut olduğunda en son **çalıştırmada oluşturulmuş** sistem istemi raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcılaştırılır.
- `System prompt (estimate)` = çalıştırma raporu yoksa (veya raporu üretmeyen bir CLI arka ucu üzerinden çalışırken) anında hesaplanır.

Her iki durumda da boyutları ve en büyük katkı sağlayanları raporlar; tam sistem istemini veya araç şemalarını **dökmez**.

## İlgili

<CardGroup cols={2}>
  <Card title="Bağlam motoru" href="/tr/concepts/context-engine" icon="puzzle-piece">
    Plugin'ler aracılığıyla özel bağlam enjeksiyonu.
  </Card>
  <Card title="Compaction" href="/tr/concepts/compaction" icon="compress">
    Uzun konuşmaları model penceresinin içinde tutmak için özetleme.
  </Card>
  <Card title="Sistem istemi" href="/tr/concepts/system-prompt" icon="message-lines">
    Sistem isteminin nasıl oluşturulduğu ve her turda ne enjekte ettiği.
  </Card>
  <Card title="Ajan döngüsü" href="/tr/concepts/agent-loop" icon="arrows-rotate">
    Gelen mesajdan nihai yanıta kadar tam ajan yürütme döngüsü.
  </Card>
</CardGroup>
