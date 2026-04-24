---
read_when:
    - OpenClaw'da “bağlam”ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin neden bir şeyi “bildiğini” (veya unuttuğunu) hata ayıklıyorsunuz
    - Bağlam yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-04-24T09:05:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

“Bağlam”, **OpenClaw'ın bir çalıştırma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Başlangıç düzeyi zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/çalışma zamanı ve enjekte edilen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturum için sizin mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görseller/ses, vb.

Bağlam, “bellek” ile _aynı şey değildir_: bellek diske kaydedilip daha sonra yeniden yüklenebilir; bağlam ise modelin geçerli penceresinin içindeki şeydir.

## Hızlı başlangıç (bağlamı inceleme)

- `/status` → hızlı “pencerem ne kadar dolu?” görünümü + oturum ayarları.
- `/context list` → neyin enjekte edildiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha derin döküm: dosya başına, araç şeması boyutları, skill girdi boyutları ve sistem istemi boyutu.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım altbilgisi ekler.
- `/compact` → pencere alanı boşaltmak için eski geçmişi kompakt bir girdide özetler.

Ayrıca bkz.: [Slash komutları](/tr/tools/slash-commands), [Token kullanımı ve maliyetler](/tr/reference/token-use), [Compaction](/tr/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç politikasına ve çalışma alanınızda ne olduğuna göre değişir.

### `/context list`

```
🧠 Bağlam dökümü
Çalışma alanı: <workspaceDir>
Bootstrap en çok/dosya: 12,000 karakter
Sandbox: mode=non-main sandboxed=false
Sistem istemi (çalıştırma): 38,412 karakter (~9,603 tok) (Project Context 23,901 karakter (~5,976 tok))

Enjekte edilen çalışma alanı dosyaları:
- AGENTS.md: OK | ham 1,742 karakter (~436 tok) | enjekte edilen 1,742 karakter (~436 tok)
- SOUL.md: OK | ham 912 karakter (~228 tok) | enjekte edilen 912 karakter (~228 tok)
- TOOLS.md: TRUNCATED | ham 54,210 karakter (~13,553 tok) | enjekte edilen 20,962 karakter (~5,241 tok)
- IDENTITY.md: OK | ham 211 karakter (~53 tok) | enjekte edilen 211 karakter (~53 tok)
- USER.md: OK | ham 388 karakter (~97 tok) | enjekte edilen 388 karakter (~97 tok)
- HEARTBEAT.md: MISSING | ham 0 | enjekte edilen 0
- BOOTSTRAP.md: OK | ham 0 karakter (~0 tok) | enjekte edilen 0 karakter (~0 tok)

Skills listesi (sistem istemi metni): 2,184 karakter (~546 tok) (12 skill)
Araçlar: read, edit, write, exec, process, browser, message, sessions_send, …
Araç listesi (sistem istemi metni): 1,032 karakter (~258 tok)
Araç şemaları (JSON): 31,988 karakter (~7,997 tok) (bağlama sayılır; metin olarak gösterilmez)
Araçlar: (yukarıdakiyle aynı)

Oturum token'ları (önbelleğe alınmış): 14,250 toplam / ctx=32,000
```

### `/context detail`

```
🧠 Bağlam dökümü (ayrıntılı)
…
En büyük Skills (istem girdi boyutu):
- frontend-design: 412 karakter (~103 tok)
- oracle: 401 karakter (~101 tok)
… (+10 tane daha skill)

En büyük araçlar (şema boyutu):
- browser: 9,812 karakter (~2,453 tok)
- exec: 6,240 karakter (~1,560 tok)
… (+N tane daha araç)
```

## Bağlam penceresine neler sayılır

Modelin aldığı her şey sayılır; buna şunlar dahildir:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/transkriptler (görseller/ses/dosyalar).
- Compaction özetleri ve budama yapıtları.
- Sağlayıcı “sarmalayıcıları” veya gizli üst bilgiler (görünmez, ama yine de sayılır).

## OpenClaw sistem istemini nasıl oluşturur

Sistem istemi **OpenClaw'a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca meta veri; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı saati).
- Çalışma zamanı meta verileri (ana makine/OS/model/düşünme).
- **Project Context** altında enjekte edilen çalışma alanı bootstrap dosyaları.

Tam döküm: [Sistem İstemi](/tr/concepts/system-prompt).

## Enjekte edilen çalışma alanı dosyaları (Project Context)

Varsayılan olarak OpenClaw sabit bir çalışma alanı dosyası kümesini enjekte eder (varsa):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırma)

Büyük dosyalar, dosya başına `agents.defaults.bootstrapMaxChars` kullanılarak kısaltılır (varsayılan `12000` karakter). OpenClaw ayrıca dosyalar genelinde toplam bootstrap enjeksiyonu için `agents.defaults.bootstrapTotalMaxChars` ile bir üst sınır uygular (varsayılan `60000` karakter). `/context`, **ham ve enjekte edilen** boyutları ve kısaltma olup olmadığını gösterir.

Kısaltma gerçekleştiğinde, çalışma zamanı Project Context altında istem içi bir uyarı bloğu enjekte edebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `once`).

## Skills: enjekte edilenler ve isteğe bağlı yüklenenler

Sistem istemi, kompakt bir **Skills listesi** içerir (ad + açıklama + konum). Bu listenin gerçek bir yükü vardır.

Skill talimatları varsayılan olarak _eklenmez_. Modelin, skill'in `SKILL.md` dosyasını **yalnızca gerektiğinde** `read` ile okuması beklenir.

## Araçlar: iki tür maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** (“Tooling” olarak gördüğünüz şey).
2. **Araç şemaları** (JSON). Bunlar, modelin araçları çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz bile bağlama sayılırlar.

`/context detail`, neyin baskın olduğunu görebilmeniz için en büyük araç şemalarını döker.

## Komutlar, yönergeler ve "satır içi kısayollar"

Slash komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` içeren bir mesaj komut olarak çalışır.
- **Yönergeler**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue`, model mesajı görmeden önce ayıklanır.
  - Yalnızca yönerge içeren mesajlar oturum ayarlarını kalıcılaştırır.
  - Normal bir mesaj içindeki satır içi yönergeler, mesaj başına ipucu görevi görür.
- **Satır içi kısayollar** (yalnızca izin verilen gönderenler): normal bir mesaj içindeki bazı `/...` belirteçleri hemen çalışabilir (örnek: “hey /status”) ve kalan metin modele gösterilmeden önce ayıklanır.

Ayrıntılar: [Slash komutları](/tr/tools/slash-commands).

## Oturumlar, Compaction ve budama (kalıcı olanlar)

Mesajlar arasında neyin kalıcı olduğu kullanılan mekanizmaya bağlıdır:

- **Normal geçmiş**, politika tarafından kompaktlaştırılana/budanana kadar oturum transkriptinde kalır.
- **Compaction**, bir özeti transkripte kalıcılaştırır ve son mesajları olduğu gibi tutar.
- **Budama**, bağlam penceresi alanı boşaltmak için eski araç sonuçlarını _bellek içi_ istemden çıkarır, ancak oturum transkriptini yeniden yazmaz — tam geçmiş disk üzerinde hâlâ incelenebilir durumdadır.

Belgeler: [Oturum](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning).

Varsayılan olarak OpenClaw, derleme ve
Compaction için yerleşik `legacy` bağlam motorunu kullanır. `kind: "context-engine"` sağlayan bir Plugin kurar ve
onu `plugins.slots.contextEngine` ile seçerseniz, OpenClaw bağlam
derlemeyi, `/compact` komutunu ve ilgili alt ajan bağlam yaşam döngüsü kancalarını bunun yerine o
motora devreder. `ownsCompaction: false`, `legacy`
motora otomatik geri dönüş sağlamaz; etkin motorun yine de `compact()` işlevini doğru uygulaması gerekir. Tam
takılabilir arayüz, yaşam döngüsü kancaları ve yapılandırma için
[Bağlam Motoru](/tr/concepts/context-engine) bölümüne bakın.

## `/context` aslında neyi raporlar

`/context`, mümkün olduğunda en son **çalıştırma sırasında oluşturulmuş** sistem istemi raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcılaştırılır.
- `System prompt (estimate)` = çalıştırma raporu yoksa (veya rapor üretmeyen bir CLI arka ucu üzerinden çalışıyorsa) anlık olarak hesaplanır.

Her iki durumda da boyutları ve en büyük katkı sağlayanları raporlar; tam sistem istemini veya araç şemalarını dökmez.

## İlgili

- [Bağlam Motoru](/tr/concepts/context-engine) — Plugin'ler aracılığıyla özel bağlam enjeksiyonu
- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
- [Sistem İstemi](/tr/concepts/system-prompt) — sistem isteminin nasıl oluşturulduğu
- [Ajan Döngüsü](/tr/concepts/agent-loop) — tam ajan yürütme döngüsü
