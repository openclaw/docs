---
read_when:
    - OpenClaw’da “bağlam”ın ne anlama geldiğini anlamak istiyorsunuz
    - Modelin neden bir şeyi “bildiğini” (veya unuttuğunu) hata ayıklıyorsunuz
    - Bağlam yükünü azaltmak istiyorsunuz (/context, /status, /compact)
summary: 'Bağlam: modelin ne gördüğü, nasıl oluşturulduğu ve nasıl inceleneceği'
title: Bağlam
x-i18n:
    generated_at: "2026-04-05T13:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Bağlam

“Bağlam”, **OpenClaw’ın bir çalıştırma için modele gönderdiği her şeydir**. Modelin **bağlam penceresi** (token sınırı) ile sınırlıdır.

Yeni başlayanlar için zihinsel model:

- **Sistem istemi** (OpenClaw tarafından oluşturulur): kurallar, araçlar, Skills listesi, zaman/çalışma zamanı ve eklenen çalışma alanı dosyaları.
- **Konuşma geçmişi**: bu oturum için sizin mesajlarınız + asistanın mesajları.
- **Araç çağrıları/sonuçları + ekler**: komut çıktısı, dosya okumaları, görseller/ses, vb.

Bağlam, “hafıza” ile _aynı şey değildir_: hafıza diskte depolanabilir ve daha sonra yeniden yüklenebilir; bağlam ise modelin geçerli penceresinin içinde olandır.

## Hızlı başlangıç (bağlamı inceleyin)

- `/status` → “pencerem ne kadar dolu?” için hızlı görünüm + oturum ayarları.
- `/context list` → nelerin eklendiği + yaklaşık boyutlar (dosya başına + toplamlar).
- `/context detail` → daha ayrıntılı döküm: dosya başına, araç şeması boyutları, skill giriş boyutları ve sistem istemi boyutu.
- `/usage tokens` → normal yanıtlara yanıt başına kullanım altbilgisi ekler.
- `/compact` → pencere alanı açmak için eski geçmişi kompakt bir girişte özetler.

Ayrıca bkz.: [Slash commands](/tools/slash-commands), [Token use & costs](/reference/token-use), [Compaction](/concepts/compaction).

## Örnek çıktı

Değerler modele, sağlayıcıya, araç ilkesine ve çalışma alanınızda ne bulunduğuna göre değişir.

### `/context list`

```
🧠 Bağlam dökümü
Çalışma alanı: <workspaceDir>
Bootstrap maks./dosya: 20,000 karakter
Sandbox: mode=non-main sandboxed=false
Sistem istemi (çalıştırma): 38,412 karakter (~9,603 token) (Project Context 23,901 karakter (~5,976 token))

Eklenen çalışma alanı dosyaları:
- AGENTS.md: TAMAM | ham 1,742 karakter (~436 token) | eklenen 1,742 karakter (~436 token)
- SOUL.md: TAMAM | ham 912 karakter (~228 token) | eklenen 912 karakter (~228 token)
- TOOLS.md: KIRPILDI | ham 54,210 karakter (~13,553 token) | eklenen 20,962 karakter (~5,241 token)
- IDENTITY.md: TAMAM | ham 211 karakter (~53 token) | eklenen 211 karakter (~53 token)
- USER.md: TAMAM | ham 388 karakter (~97 token) | eklenen 388 karakter (~97 token)
- HEARTBEAT.md: EKSİK | ham 0 | eklenen 0
- BOOTSTRAP.md: TAMAM | ham 0 karakter (~0 token) | eklenen 0 karakter (~0 token)

Skills listesi (sistem istemi metni): 2,184 karakter (~546 token) (12 skill)
Araçlar: read, edit, write, exec, process, browser, message, sessions_send, …
Araç listesi (sistem istemi metni): 1,032 karakter (~258 token)
Araç şemaları (JSON): 31,988 karakter (~7,997 token) (bağlama dahil edilir; metin olarak gösterilmez)
Araçlar: (yukarıdakiyle aynı)

Oturum token’ları (önbellekli): 14,250 toplam / ctx=32,000
```

### `/context detail`

```
🧠 Bağlam dökümü (ayrıntılı)
…
En büyük skill’ler (istem giriş boyutu):
- frontend-design: 412 karakter (~103 token)
- oracle: 401 karakter (~101 token)
… (+10 skill daha)

En büyük araçlar (şema boyutu):
- browser: 9,812 karakter (~2,453 token)
- exec: 6,240 karakter (~1,560 token)
… (+N tane daha araç)
```

## Bağlam penceresine neler dahil edilir

Modelin aldığı her şey sayılır; şunlar dahil:

- Sistem istemi (tüm bölümler).
- Konuşma geçmişi.
- Araç çağrıları + araç sonuçları.
- Ekler/transkriptler (görseller/ses/dosyalar).
- Kompaktlama özetleri ve budama artifaktları.
- Sağlayıcı “wrapper”ları veya gizli başlıkları (görünmezler, ama yine de sayılırlar).

## OpenClaw sistem istemini nasıl oluşturur

Sistem istemi **OpenClaw’a aittir** ve her çalıştırmada yeniden oluşturulur. Şunları içerir:

- Araç listesi + kısa açıklamalar.
- Skills listesi (yalnızca meta veri; aşağıya bakın).
- Çalışma alanı konumu.
- Zaman (UTC + yapılandırılmışsa dönüştürülmüş kullanıcı saati).
- Çalışma zamanı meta verileri (ana bilgisayar/OS/model/thinking).
- **Project Context** altındaki eklenmiş çalışma alanı önyükleme dosyaları.

Tam döküm: [System Prompt](/concepts/system-prompt).

## Eklenen çalışma alanı dosyaları (Project Context)

Varsayılan olarak OpenClaw, sabit bir çalışma alanı dosyaları kümesini ekler (varsa):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (yalnızca ilk çalıştırmada)

Büyük dosyalar, dosya başına `agents.defaults.bootstrapMaxChars` kullanılarak kırpılır (varsayılan `20000` karakter). OpenClaw ayrıca dosyalar genelinde toplam bir önyükleme ekleme sınırı uygular: `agents.defaults.bootstrapTotalMaxChars` (varsayılan `150000` karakter). `/context`, **ham ile eklenen** boyutları ve kırpma olup olmadığını gösterir.

Kırpma gerçekleştiğinde çalışma zamanı, Project Context altında istem içinde bir uyarı bloğu ekleyebilir. Bunu `agents.defaults.bootstrapPromptTruncationWarning` ile yapılandırın (`off`, `once`, `always`; varsayılan `once`).

## Skills: eklenenler ve isteğe bağlı yüklenenler

Sistem istemi, kompakt bir **skills listesi** içerir (ad + açıklama + konum). Bu listenin gerçek bir yükü vardır.

Skill yönergeleri varsayılan olarak _dahil edilmez_. Modelin, skill’in `SKILL.md` dosyasını **yalnızca gerektiğinde** `read` ile okuması beklenir.

## Araçlar: iki tür maliyet vardır

Araçlar bağlamı iki şekilde etkiler:

1. Sistem istemindeki **araç listesi metni** (sizin “Tooling” olarak gördüğünüz şey).
2. **Araç şemaları** (JSON). Bunlar, araç çağırabilmesi için modele gönderilir. Düz metin olarak görmeseniz de bağlama dahil edilirler.

`/context detail`, neyin baskın olduğunu görebilmeniz için en büyük araç şemalarını döker.

## Komutlar, yönergeler ve "satır içi kısayollar"

Slash komutları Gateway tarafından işlenir. Birkaç farklı davranış vardır:

- **Bağımsız komutlar**: yalnızca `/...` olan bir mesaj komut olarak çalıştırılır.
- **Yönergeler**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue`, model mesajı görmeden önce ayıklanır.
  - Yalnızca yönerge içeren mesajlar oturum ayarlarını kalıcı hale getirir.
  - Normal bir mesaj içindeki satır içi yönergeler, mesaj başına ipucu gibi davranır.
- **Satır içi kısayollar** (yalnızca allowlist’teki gönderenler): normal bir mesaj içindeki belirli `/...` token’ları hemen çalıştırılabilir (örnek: “hey /status”) ve model kalan metni görmeden önce ayıklanır.

Ayrıntılar: [Slash commands](/tools/slash-commands).

## Oturumlar, kompaktlama ve budama (neler kalıcı olur)

Mesajlar arasında neyin kalıcı olduğu, kullanılan mekanizmaya bağlıdır:

- **Normal geçmiş**, ilke tarafından kompaktlanana/budanana kadar oturum transkriptinde kalıcı olur.
- **Compaction**, özeti transkripte kalıcı olarak yazar ve son mesajları bozulmadan tutar.
- **Pruning**, bir çalıştırma için _bellek içi_ istemden eski araç sonuçlarını kaldırır, ancak transkripti yeniden yazmaz.

Belgeler: [Session](/concepts/session), [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning).

Varsayılan olarak OpenClaw, derleme ve kompaktlama için yerleşik `legacy` bağlam motorunu kullanır.
`kind: "context-engine"` sağlayan bir plugin yüklerseniz ve bunu
`plugins.slots.contextEngine` ile seçerseniz, OpenClaw bağlam derlemeyi,
`/compact` komutunu ve ilgili alt aracı bağlam yaşam döngüsü hook’larını bunun yerine
o motora devreder. `ownsCompaction: false`, `legacy`
motora otomatik geri dönüş sağlamaz; etkin motorun yine de `compact()` işlevini doğru
uygulaması gerekir. Tam takılabilir arayüz, yaşam döngüsü hook’ları ve yapılandırma için
[Context Engine](/concepts/context-engine) belgesine bakın.

## `/context` gerçekte neyi raporlar

`/context`, mümkün olduğunda en son **çalıştırma sırasında oluşturulmuş** sistem istemi raporunu tercih eder:

- `System prompt (run)` = son gömülü (araç kullanabilen) çalıştırmadan yakalanır ve oturum deposunda kalıcı hale getirilir.
- `System prompt (estimate)` = çalıştırma raporu yoksa (veya raporu oluşturmayan bir CLI backend üzerinden çalışıyorsa) anlık olarak hesaplanır.

Her iki durumda da boyutları ve en büyük katkıda bulunanları raporlar; tam sistem istemini veya araç şemalarını dökmez.

## İlgili

- [Context Engine](/concepts/context-engine) — plugin’ler aracılığıyla özel bağlam ekleme
- [Compaction](/concepts/compaction) — uzun konuşmaları özetleme
- [System Prompt](/concepts/system-prompt) — sistem isteminin nasıl oluşturulduğu
- [Agent Loop](/concepts/agent-loop) — tam agent yürütme döngüsü
