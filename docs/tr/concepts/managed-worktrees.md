---
read_when:
    - Bir ajan görevi için yalıtılmış bir dal ve çalışma kopyası istiyorsunuz
    - Workboard kartlarını worktree çalışma alanlarıyla yapılandırıyorsunuz
    - OpenClaw tarafından yönetilen bir çalışma ağacını geri yüklemeniz veya temizlemeniz gerekiyor
summary: Otomatik anlık görüntüler ve temizleme ile yalıtılmış git çalışma kopyalarında ajan görevlerini çalıştırın
title: Yönetilen çalışma ağaçları
x-i18n:
    generated_at: "2026-07-12T12:14:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Yönetilen çalışma ağaçları, kaynak deposunun içine geçici dizinler yerleştirmeden bir ajan görevine kendi git dalını ve çalışma kopyasını sağlar. OpenClaw bunları durum dizini altında oluşturur, paylaşılan durum veritabanına kaydeder ve kaldırmadan önce izlenen ve yok sayılmayan izlenmeyen içeriklerinin anlık görüntüsünü alır.

## Düzen ve adlar

Her çalışma ağacı şu konumda bulunur:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Depo parmak izi, kurallı git ortak dizini ve origin URL'si üzerinden hesaplanan SHA-256 karmasının ilk 16 onaltılık karakteridir. Sağlanan bir ad `[a-z0-9][a-z0-9-]{0,63}` kalıbıyla eşleşmelidir. Ad sağlanmazsa OpenClaw, `wt-` önekinin ardından sekiz rastgele onaltılık karakterden oluşan bir ad üretir.

OpenClaw, istenen temel ref üzerinde `openclaw/<name>` dalını oluşturur. Temel ref sağlanmazsa `origin` kaynağını getirir, mevcut olduğunda uzak deponun varsayılan dalını kullanır ve depo çevrimdışıysa veya kullanılabilir bir uzak deposu yoksa yerel `HEAD` değerine geri döner.

## Yok sayılan dosyaları sağlama

Seçili yok sayılan, izlenmeyen dosyaları yeni bir çalışma ağacına kopyalamak için kaynak deponun köküne `.worktreeinclude` ekleyin. Dosya, satır başına bir kalıp ve `#` açıklamalarıyla gitignore kalıbı söz dizimini kullanır:

```gitignore
.env.local
fixtures/generated/**
```

Yalnızca git tarafından hem yok sayılan hem de izlenmeyen olarak bildirilen dosyalar uygundur. İzlenen dosyalar git aracılığıyla zaten mevcuttur ve bu adımda hiçbir zaman kopyalanmaz. OpenClaw hedef dosyaların üzerine yazmaz veya sembolik bağlantılı dizinleri izlemez ve kopyalanan dosya kiplerini korur.

## Depo kurulumunu çalıştırma

Kaynak depoda `.openclaw/worktree-setup.sh` mevcut ve çalıştırılabilir durumdaysa OpenClaw, geçerli dizin olarak yeni çalışma ağacını kullanarak bu betiği çalıştırır. Betik şunları alır:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Sıfır olmayan bir çıkış, oluşturmayı iptal eder ve yeni çalışma ağacıyla dalı kaldırır. Bu, depoya özgü yerel bir sözleşmedir; bunun için bir OpenClaw yapılandırma anahtarı yoktur.

## Oturum çalışma ağaçları

Çalışma ağacı destekli bir oturumla etkin ajanın git çalışma alanından yalıtılmış bir sohbet başlatın: Control UI'ın New session sayfasında **Worktree** seçeneğini etkinleştirin (bu sayfa ayrıca bir temel dal seçici ve isteğe bağlı çalışma ağacı adı sunar) veya iOS'ta Chat actions menüsünü ya da Android'de New Chat yanındaki taşma eylemini kullanın. Bu seçenek yalnızca istemcinin bu yeteneğe sahip olduğu, git destekli bir ajan için kullanılabilir; ön kontrol yapamayan istemciler bunun yerine gateway hatasını gösterir.

Kodlama ajanları, mevcut görevin dışında doğrulanmış takip işi keşfettiklerinde `spawn_task` çağrısı da yapabilir. Control UI hiçbir şey başlatmadan bir öneri çipi gösterirken Gateway destekli bir TUI aynı eylemleri içeren etkileşimli bir istem gösterir. **Start in worktree** seçildiğinde, önerilen projeden oturuma ait yeni bir çalışma ağacı oluşturulur ve kendi kendine yeterli istem ilk tur olarak gönderilir; önerinin kapatılması depoyu değiştirmez. Öneriler ve kimlikleri geçicidir ve Gateway yeniden başlatıldığında korunmaz.

OpenClaw bu araçları yalnızca işlem yapılabilir bir Gateway kullanıcı arayüzüne sahip operatör oturumlarına sunar. Kanal oturumları ile yerel/gömülü TUI oturumları, bu yüzeyler taşınabilir ve türü belirlenmiş bir görev-eylem sözleşmesine sahip olana kadar bunları almaz.

Ortaya çıkan yönetilen çalışma ağacının sahibi oturumdur ve bu oturumdaki her ajan çalıştırması onun çalışma kopyasını kullanır. Çalışma alanı bir depo alt dizini olduğunda, çalışma ağacı depo köküne sabitlenir ve oturum bunun içindeki eşleşen alt dizinden çalışır. Oturum çalışma ağacı oluşturma, yöntemin `operator.write` kapsamını kullanır; ancak `.openclaw/worktree-setup.sh` adımı depo kodunu çalıştırdığı için yalnızca `operator.admin` çağıranları adına çalışır. `.worktreeinclude` sağlama işlemi yine de her çağırana uygulanır. Oturum silindiğinde çalışma ağacı yalnızca kayıpsız biçimde kaldırılabiliyorsa kaldırılır. Değişiklik içeren çalışma ağaçları veya gönderilmemiş commit'lere sahip dallar kullanılabilir durumda kalır; saatlik temizleme, yakın tarihli oturum etkinliğini çalışma ağacı etkinliği olarak değerlendirerek oturum çalışma ağaçlarının 7 gün boşta kalmasının ardından anlık görüntüsünü alır. Kaldırılan çalışma ağaçları, aşağıda açıklandığı şekilde anlık görüntülerinden geri yüklenebilir.

Bir görev, yapılandırılmış ajan çalışma alanı dışındaki bir projeyi hedeflediğinde `sessions.create`, `worktree: true` ile birlikte mutlak bir `cwd` içerebilir. Bu açık ana makine yolu `operator.admin` gerektirir; sıradan çalışma ağacı sohbeti oluşturma işlemi `operator.write` olarak kalır ve yapılandırılmış çalışma alanına sabitlenir.

`sessions.create`, temel ref'i ve çalışma ağacı adını seçmek için `worktree: true` ile birlikte `worktreeBaseRef` ve `worktreeName` değerlerini de kabul eder (dal `openclaw/<name>` olur); her ikisi de `operator.write` kapsamında kalır. Oluşturulan çalışma ağacı, oluşturma sonucunda döndürülür ve oturum satırında `worktree: { id, branch, repoRoot }` olarak kalıcılaştırılır; böylece oturum listeleri çalışma kopyasını ve dalı gösterebilir. Bir oturum silinirken korunmuş, değişiklik içeren çalışma kopyası sessizce geride bırakılmak yerine `worktreePreserved` olarak bildirilir.

## Anlık görüntüler, temizleme ve geri yükleme

Kaldırma işlemi önce izlenen ve yok sayılmayan izlenmeyen dosyaları içeren sentetik bir commit oluşturur ve bunu `refs/openclaw/snapshots/<id>` konumuna sabitler. Git tarafından yok sayılan dosyalar depo nesne veritabanına dahil edilmez; `.worktreeinclude` tarafından seçilen dosyalar geri yükleme sırasında yeniden kopyalanır. Anlık görüntü oluşturma başarısız olursa kaldırma durur. Açık bir zorla silme işlemi anlık görüntü olmadan devam edebilir.

OpenClaw şu temizleme kurallarını uygular:

- Çalıştırma sonunda yalnızca `git status --porcelain` çıktısı boşsa ve `git log HEAD --not --remotes --oneline` gönderilmemiş commit bulmazsa çalışma ağacını kaldırır. Aksi takdirde yalnızca etkinlik kilidini serbest bırakır.
- Saatlik temizleme, kilitli olmayan ve Workboard'a veya oturuma ait çalışma ağaçları 7 günden uzun süredir boşta kaldığında, değişiklik içerseler bile anlık görüntülerini alır ve kaldırır. Elle oluşturulan çalışma ağaçları hiçbir zaman otomatik olarak kaldırılmaz.
- Anlık görüntü kayıtları 30 gün boyunca geri yüklenebilir durumda kalır. Ardından temizleme işlemi anlık görüntü ref'ini ve kayıt satırını siler.
- Çalışan bir OpenClaw işlem kilidi ile yabancı veya tanınmayan herhangi bir git çalışma ağacı kilidi, çalışma ağacını çöp toplamadan korur.

Geri yükleme, özgün anlık görüntü öncesi commit'te `openclaw/<name>` dalını yeniden oluşturur, ardından anlık görüntü farklılıklarını hazırlanmamış değişiklikler ve izlenmeyen dosyalar olarak yeniden oluşturur. Bu, sentetik anlık görüntü commit'ini dal geçmişinin dışında tutar. Anlık görüntü ref'i kaynak bilgisi olarak kayıtlı kalır.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Ayarlar altındaki Control UI **Worktrees** sayfası, aynı eylemlerin yanı sıra temel dal seçiciyle oluşturma olanağı sağlar, her çalışma ağacının sahibini (elle oluşturulan, Workboard veya sohbetine bağlantı içeren sahibi olan oturum) gösterir ve kaldırma işlemi başarısız bir anlık görüntü bildirdiğinde zorla yeniden deneme seçeneği sunar.

## Gateway yöntemleri

| Yöntem               | Amaç                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `worktrees.list`     | Etkin ve geri yüklenebilir çalışma ağacı kayıtlarını listeler.                            |
| `worktrees.branches` | Temel ref seçicileri için bir deponun yerel ve uzak dallarını listeler.                    |
| `worktrees.create`   | Adlandırılmış yönetilen bir çalışma ağacı oluşturur veya yeniden kullanır.                 |
| `worktrees.remove`   | Bir çalışma ağacının anlık görüntüsünü alır ve kaldırır. Zorla kaldırmalar `snapshotError` bildirir. |
| `worktrees.restore`  | Kaldırılmış bir çalışma ağacını anlık görüntüsünden geri yükler.                           |
| `worktrees.gc`       | Boşta, sahipsiz ve saklama süresi dolmuş öğelerin temizliğini şimdi çalıştırır.            |

`worktrees.list`, `operator.read` gerektirir ve değişiklik yapan yöntemler `operator.admin` gerektirir. `worktrees.branches`, yapılandırılmış ajan çalışma alanları için `operator.write` gerektirirken diğer tüm ana makine yolları `operator.admin` gerektirir (`sessions.create` cwd eşiğiyle eşleşir). Yalnızca mevcut ref'leri okur ve hiçbir zaman getirme işlemi yapmaz; yalnızca uzakta bulunan dallar, döndürülen her adın temel ref olarak çözümlenebilmesi için uzak adını içerecek biçimde (`origin/feature-a`) döndürülür.

## Workboard çalışma alanları

Paketle birlikte gelen [Workboard plugin'i](/tr/plugins/workboard), bir kart çalışma alanını yönetilen çalışma ağacı olarak oluşturabilir:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path`, kaynak git çalışma kopyasını tanımlar. `branch` isteğe bağlıdır ve temel ref olur. Gönderim kartın çalışanını başlattığında Workboard, `wb-<card-id>` çalışma ağacını oluşturur veya yeniden kullanır, alt ajanı çalışma dizini olarak yönetilen çalışma kopyasıyla çalıştırır ve çözümlenen yolu ve dalı karta geri yazar. Gateway tarafından tetiklenen oluşturma işlemi `operator.admin` gerektirir. Çalıştırma sonunda Workboard, çalışma kopyasını yalnızca kayıpsız olduğu kanıtlanabiliyorsa kaldırır; değişiklik içeren çalışmalar veya gönderilmemiş commit'ler kullanılabilir durumda kalır.

Korumalı alandaki gömülü ajanlar şu anda yapılandırılmış ajan çalışma alanlarının dışındaki bir görev çalışma dizinini reddeder. Korumalı alan çalışma zamanı ek bir çalışma kopyası bağlamasını destekleyene kadar Workboard yönetilen çalışma ağacı kartları için korumalı alan kullanmayan bir hedef ajan kullanın.
