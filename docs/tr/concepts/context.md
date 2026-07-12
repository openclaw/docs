---
read_when:
    - OpenClaw'da "bağlam"ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin bir şeyi neden "bildiğini" (veya unuttuğunu) araştırıyorsunuz
    - Bağlam yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin gördükleri, bağlamın nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-07-12T12:12:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"Bağlam", **OpenClaw'ın bir çalıştırma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Başlangıç için zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/çalışma zamanı ve eklenen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturumdaki mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktıları, dosya okumaları, görüntüler/sesler vb.

Bağlam, "bellek" ile _aynı şey değildir_: bellek diskte saklanıp daha sonra yeniden yüklenebilir; bağlam ise modelin mevcut penceresinin içindekilerdir.

## Hızlı başlangıç (bağlamı inceleme)

- `/status` → hızlı "pencerem ne kadar dolu?" görünümü + oturum ayarları.
- `/context list` → nelerin eklendiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha ayrıntılı döküm: dosya başına boyutlar, araç şeması boyutları, Skills girdisi başına boyutlar, sistem istemi boyutu ve sıkıştırılabilir transkript mesajı sayıları.
- `/context map` → mevcut oturumun izlenen bağlam katkılarını gösteren WinDirStat tarzı ağaç haritası görüntüsü.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım altbilgisi ekler.
- `/compact` → pencere alanı açmak için eski geçmişi kompakt bir girdide özetler.

Ayrıca bkz.: [Eğik çizgi komutları](/tr/tools/slash-commands), [Token kullanımı ve maliyetleri](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç politikasına ve çalışma alanınızdaki içeriğe göre değişir.

### `/context list`

```text
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

```text
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

En son önbelleğe alınmış çalıştırma raporu ile oturum transkriptinden oluşturulan bir görüntü gönderir. Oturumda normal bir mesaj henüz bir çalıştırma raporu üretmediyse `/context map`, tahmini görselleştirmek yerine kullanılamıyor mesajı döndürür. Dikdörtgen alanı, izlenen istem karakterleriyle orantılıdır:

- konuşma transkripti (kullanıcı mesajları, asistan yanıtları, araç sonuçları, Compaction özetleri) ile yalnızca modele ulaşan tur başına çalışma zamanı bağlamı ve kanca istemi eklemeleri
- eklenen çalışma alanı dosyaları
- temel sistem istemi metni
- Skills istem girdileri
- araç JSON şemaları

Konuşma grubu oturum ilerledikçe büyür; bu nedenle harita her turda değişir. Compaction sonrasında bir özetler kutucuğuna daralır.

Önbelleğe alınmış çalıştırma raporu olmadığında `/context list`, `/context detail` ve `/context json` yine de isteğe bağlı bir tahmini inceleyebilir.

## Bağlam penceresine neler dâhildir?

Modelin aldığı her şey buna dâhildir:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/transkriptler (görüntüler/sesler/dosyalar).
- Compaction özetleri ve budama yapıtları.
- Sağlayıcı "sarmalayıcıları" veya gizli üstbilgiler (görünmezler ancak yine de hesaba katılırlar).

## OpenClaw sistem istemini nasıl oluşturur?

Sistem isteminin **sahibi OpenClaw'dır** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca meta veriler; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı zamanı).
- Çalışma zamanı meta verileri (ana makine/işletim sistemi/model/düşünme).
- **Proje Bağlamı** altında eklenen çalışma alanı önyükleme dosyaları.

Tam döküm: [Sistem İstemi](/tr/concepts/system-prompt).

## Eklenen çalışma alanı dosyaları (Proje Bağlamı)

OpenClaw, varsayılan olarak sabit bir çalışma alanı dosyası kümesini (mevcutsa) ekler:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırma)

Büyük dosyalar, dosya başına `agents.defaults.bootstrapMaxChars` (varsayılan `20000` karakter) kullanılarak kırpılır. OpenClaw ayrıca `agents.defaults.bootstrapTotalMaxChars` (varsayılan `60000` karakter) ile dosyalar genelinde toplam önyükleme ekleme sınırı uygular. `/context`, **ham ve eklenen** boyutları ve kırpma gerçekleşip gerçekleşmediğini gösterir.

Kırpma gerçekleştiğinde çalışma zamanı, Proje Bağlamı altında istem içine bir uyarı bloğu ekleyebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; varsayılan `always`) ile yapılandırın.

## Skills: eklenenler ve isteğe bağlı yüklenenler

Sistem istemi, kompakt bir **Skills listesi** (ad + açıklama + konum) içerir. Bu listenin gerçek bir ek yükü vardır.

Skill talimatları varsayılan olarak _dâhil edilmez_. Modelin, Skill'in `SKILL.md` dosyasını **yalnızca gerektiğinde** `read` ile okuması beklenir.

## Araçlar: iki tür maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** ("Araçlar" olarak gördüğünüz bölüm).
2. **Araç şemaları** (JSON). Bunlar, modelin araçları çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz de bağlama dâhil edilirler.

`/context detail`, en büyük araç şemalarını ayrıntılı olarak göstererek hangilerinin baskın olduğunu görmenizi sağlar.

## Komutlar, yönergeler ve "satır içi kısayollar"

Eğik çizgi komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` içeren bir mesaj komut olarak çalıştırılır.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`, model mesajı görmeden önce çıkarılır.
  - Yalnızca yönerge içeren mesajlar oturum ayarlarını kalıcı hâle getirir.
  - Normal bir mesajdaki satır içi yönergeler, mesaj başına ipucu işlevi görür.
- **Satır içi kısayollar** (yalnızca izin verilen gönderenler): normal bir mesajın içindeki belirli `/...` token'ları hemen çalıştırılabilir (örnek: "merhaba /status") ve model kalan metni görmeden önce çıkarılır.

Ayrıntılar: [Eğik çizgi komutları](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (neler kalıcıdır?)

Mesajlar arasında nelerin kalıcı olduğu kullanılan mekanizmaya bağlıdır:

- **Normal geçmiş**, politika tarafından sıkıştırılana/budanana kadar oturum transkriptinde kalır.
- **Compaction**, bir özeti transkripte kalıcı olarak ekler ve son mesajları olduğu gibi tutar.
- **Budama**, bağlam penceresinde alan açmak için eski araç sonuçlarını _bellek içi_ istemden kaldırır ancak oturum transkriptini yeniden yazmaz; tam geçmiş yine de diskte incelenebilir.

Belgeler: [Oturum](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning).

OpenClaw, varsayılan olarak birleştirme ve Compaction için yerleşik `legacy` bağlam motorunu kullanır. `kind: "context-engine"` sağlayan bir plugin kurup bunu `plugins.slots.contextEngine` ile seçerseniz OpenClaw; bağlam birleştirmeyi, `/compact` işlemini ve ilgili alt ajan bağlam yaşam döngüsü kancalarını bunun yerine o motora devreder. `ownsCompaction: false`, otomatik olarak `legacy` motora geri dönüş sağlamaz; etkin motor yine de `compact()` işlevini doğru şekilde uygulamalıdır. Takılabilir arayüzün tamamı, yaşam döngüsü kancaları ve yapılandırma için [Bağlam Motoru](/tr/concepts/context-engine) bölümüne bakın.

## `/context` gerçekte neyi raporlar?

`/context`, mevcut olduğunda en son **çalıştırmada oluşturulan** sistem istemi raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcı olarak saklanır.
- `System prompt (estimate)` = çalıştırma raporu olmadığında (veya rapor oluşturmayan bir CLI arka ucu üzerinden çalıştırılırken) anında hesaplanır.

Her iki durumda da boyutları ve en büyük katkıları raporlar; sistem isteminin veya araç şemalarının tamamını **dökmez**. Ayrıntılı modda ayrıca oturum transkriptini Compaction tarafından kullanılan gerçek konuşma mesajlarıyla aynı ölçüte göre karşılaştırır; böylece yüksek istem/önbellek kullanımını sıkıştırılabilir konuşma geçmişinden ayırt etmek kolaylaşır.

## İlgili konular

<CardGroup cols={2}>
  <Card title="Context engine" href="/tr/concepts/context-engine" icon="puzzle-piece">
    Plugin'ler aracılığıyla özel bağlam ekleme.
  </Card>
  <Card title="Compaction" href="/tr/concepts/compaction" icon="compress">
    Uzun konuşmaları model penceresinin içinde tutmak için özetleme.
  </Card>
  <Card title="System prompt" href="/tr/concepts/system-prompt" icon="message-lines">
    Sistem isteminin nasıl oluşturulduğu ve her turda neleri eklediği.
  </Card>
  <Card title="Agent loop" href="/tr/concepts/agent-loop" icon="arrows-rotate">
    Gelen mesajdan son yanıta kadar tam ajan yürütme döngüsü.
  </Card>
</CardGroup>
