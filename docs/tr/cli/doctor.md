---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve yönlendirmeli çözümler istiyorsunuz
    - Güncelleme yaptınız ve hızlı bir doğrulama istiyorsunuz
summary: '`openclaw doctor` için CLI referansı (durum denetimleri + yönlendirmeli onarımlar)'
title: Doctor
x-i18n:
    generated_at: "2026-07-16T16:56:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway, kanallar, pluginler, Skills, model yönlendirme, yerel durum ve yapılandırma geçişleri için sistem durumu kontrolleri ve hızlı düzeltmeler. Bir şey beklendiği gibi çalışmadığında ve sorunun ne olduğunu tek bir komutun açıklamasını istediğinizde bunu kullanın.

İlgili:

- Sorun giderme: [Sorun giderme](/tr/gateway/troubleshooting)
- Güvenlik denetimi: [Güvenlik](/tr/gateway/security)

## Çalışma biçimleri

Doctor'ın beş çalışma biçimi vardır:

| Çalışma biçimi           | Komut                                     | Davranış                                                                                       |
| ------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| İnceleme                 | `openclaw doctor`                         | İnsan odaklı kontroller ve yönlendirmeli istemler.                                              |
| Onarım                   | `openclaw doctor --fix`                   | Etkileşimsiz onarım güvenli olmadığı sürece istemleri kullanarak desteklenen onarımları uygular. |
| Lint                     | `openclaw doctor --lint`                  | CI, ön kontrol ve inceleme geçitleri için salt okunur yapılandırılmış bulgular.                  |
| Paylaşılan SQLite bakımı | `openclaw doctor --state-sqlite compact`  | Standart paylaşılan durum veritabanını açıkça denetim noktasına alır, sıkıştırır ve doğrular.    |
| Oturum SQLite geçişi     | `openclaw doctor --session-sqlite <mode>` | Oturum durumunu inceler, içe aktarır, doğrular, sıkıştırır, kurtarır veya geri yükler.           |

Otomasyon kararlı bir sonuca ihtiyaç duyduğunda `--lint` tercih edin. Bir insan operatör doctor'ın yapılandırmayı veya durumu düzenlemesini istediğinde `--fix` tercih edin.

## Örnekler

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Kanala özgü izinler için `doctor` yerine kanal yoklamalarını kullanın:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities`, belirli bir kanal hedefi için botun geçerli izinlerini bildirir. `channels status --probe`, yapılandırılmış tüm kanalları ve sese otomatik katılma hedeflerini denetler.

## Seçenekler

| Seçenek                         | Etki                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Çalışma alanı belleği/arama önerilerini devre dışı bırakır.                                                                                                                                                       |
| `--yes`                         | İstem göstermeden varsayılanları kabul eder.                                                                                                                                                                     |
| `--repair` / `--fix`            | Önerilen hizmet dışı onarımları istem göstermeden uygular (`--fix` bir diğer addır). Gateway hizmeti kurulumları/yeniden yazımları için hâlâ etkileşimli onay veya açık `gateway` komutları gerekir. |
| `--force`                       | Özel hizmet yapılandırmasının üzerine yazmak da dâhil olmak üzere kapsamlı onarımlar uygular.                                                                                                                     |
| `--non-interactive`             | İstem göstermeden çalışır; yalnızca güvenli geçişleri ve hizmet dışı onarımları uygular.                                                                                                                          |
| `--generate-gateway-token`      | Bir Gateway tokeni oluşturur ve yapılandırır.                                                                                                                                                                    |
| `--allow-exec`                  | Gizli bilgileri doğrularken doctor'ın yapılandırılmış `exec` SecretRef'lerini yürütmesine izin verir.                                                                                                 |
| `--deep`                        | Ek Gateway kurulumları için sistem hizmetlerini tarar; yakın zamandaki Gateway gözetmen yeniden başlatma devirlerini bildirir.                                                                                    |
| `--lint`                        | Modernleştirilmiş sistem durumu kontrollerini salt okunur modda çalıştırır ve tanılama bulguları üretir.                                                                                                          |
| `--post-upgrade`                | Yükseltme sonrası plugin uyumluluk yoklamalarını çalıştırır; bulgular stdout'a gönderilir; hata düzeyinde herhangi bir bulgu varsa çıkış kodu 1 olur.                                                             |
| `--state-sqlite <mode>`         | Açık paylaşılan durum SQLite bakımını çalıştırır. Tek mod `compact` şeklindedir.                                                                                                                         |
| `--session-sqlite <mode>`       | Hedeflenen oturum SQLite geçiş modunu çalıştırır: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` veya `restore`.                    |
| `--session-sqlite-store <path>` | `--session-sqlite` ile: eski bir `sessions.json` deposu yolu seçer.                                                                                                                                            |
| `--session-sqlite-agent <id>`   | `--session-sqlite` ile: yapılandırılmış bir ajan seçer.                                                                                                                                                          |
| `--session-sqlite-all-agents`   | `--session-sqlite` ile: yapılandırılmış ve keşfedilmiş ajan depolarını seçer.                                                                                                                                     |
| `--github-issue`                | `--session-sqlite recover` ile: temizlenmiş bir openclaw/openclaw sorun raporu hazırlar; doctor, `--yes` veya etkileşimli onay sonrasında bunu `gh` ile oluşturur.                                  |
| `--json`                        | `--lint` ile: JSON bulguları. `--post-upgrade` ile: `{ probesRun, findings }`. `--state-sqlite` veya `--session-sqlite` ile: bakım raporunu JSON olarak üretir.                                               |
| `--severity-min <level>`        | `--lint` ile: `info`, `warning` veya `error` altındaki bulguları çıkarır.                                                                                                |
| `--all`                         | `--lint` ile: varsayılan kümeden çıkarılan isteğe bağlı kontroller dâhil tüm kayıtlı kontrolleri çalıştırır.                                                                                            |
| `--skip <id>`                   | `--lint` ile: bir kontrol kimliğini atlar. Yinelenebilir.                                                                                                                                                |
| `--only <id>`                   | `--lint` ile: yalnızca belirtilen kontrol kimliklerini çalıştırır. Yinelenebilir.                                                                                                                        |

`--severity-min`, `--all`, `--only` ve `--skip` yalnızca `--lint` ile birlikte kabul edilir; `--json` ise `--lint`, `--post-upgrade`, `--state-sqlite` ve `--session-sqlite` ile kabul edilir.

## Lint modu

`openclaw doctor --lint` salt okunurdur: istem, onarım ve yapılandırma/durum yeniden yazımı yoktur.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

İnsanlar için çıktı özlüdür:

```text
doctor --lint: 6 kontrol çalıştırıldı, 1 bulgu bulundu
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode ayarlanmamış; gateway başlatma işlemi engellenecek.
    düzeltme: `openclaw configure` komutunu çalıştırıp Gateway modunu (local/remote) ayarlayın veya `openclaw config set gateway.mode local` komutunu çalıştırın.
```

JSON çıktısı, betik oluşturma arayüzüdür:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode ayarlanmamış; gateway başlatma işlemi engellenecek.",
      "path": "gateway.mode",
      "fixHint": "`openclaw configure` komutunu çalıştırıp Gateway modunu (local/remote) ayarlayın veya `openclaw config set gateway.mode local` komutunu çalıştırın."
    }
  ]
}
```

Çıkış kodları:

| Kod | Anlam                                                                 |
| --- | --------------------------------------------------------------------- |
| `0`  | Seçilen önem derecesi eşiğinde veya üzerinde bulgu yoktur.             |
| `1`  | En az bir bulgu seçilen eşiği karşılar.                                |
| `2`  | Lint bulguları üretilemeden önce komut/çalışma zamanı hatası oluşmuştur. |

`--severity-min`, hem hangi bulguların yazdırılacağını hem de çıkış eşiğini denetler: daha düşük önem derecesine sahip `info`/`warning` bulguları mevcut olsa bile `openclaw doctor --lint --severity-min error` hiçbir şey yazdırmadan `0` koduyla çıkabilir.

`--all`, önem derecesi filtrelemesinden önce hangi kontrollerin seçileceğini denetler. Varsayılan lint çalıştırması; derin, geçmişe yönelik veya onarılabilir eski kalıntıları ortaya çıkarma olasılığı daha yüksek olan kontrolleri dışlar; eksiksiz envanter için `--all` kullanın. `--only <id>` en hassas seçicidir ve kayıtlı herhangi bir kontrolü kimliğine göre çalıştırabilir.

`core/doctor/local-audio-acceleration`, otomatik seçilen yerel STT komutunu, ayrı ayrı yetenekli/istenen/gözlemlenen arka uç kanıtlarını ve bir konuşma modeli yüklemeden geri dönüş sırasını bildirir. Bilgilendirme amaçlı bir bulgu üretir; bu nedenle görüntülemek için `--severity-min info` ekleyin.

## Yapılandırılmış sistem durumu kontrolleri

Modern doctor kontrolleri küçük ve ayrık bir sözleşme kullanır:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`, `doctor --lint` işlevini destekler. `repair()` isteğe bağlıdır ve yalnızca `doctor --fix` / `doctor --repair` altında çalışır. Henüz bu yapıya geçirilmemiş kontroller, eski doctor katkı akışını kullanmaya devam eder.

Onarım bağlamları `dryRun`/`diff` isteklerini taşıyabilir; onarım sonuçları yapılandırılmış `diffs` (yapılandırma/dosya düzenlemeleri) ve `effects` (hizmet, işlem, paket, durum veya diğer yan etkiler) döndürebilir. Böylece dönüştürülen kontroller, değişiklik planlamasını `detect()` içine taşımadan `doctor --fix --dry-run` yönünde gelişebilir.

`repair()`, `status: "repaired" | "skipped" | "failed"` bildirir (durumun belirtilmemesi `repaired` anlamına gelir). Onarım `skipped` veya `failed` döndürdüğünde doctor nedeni bildirir ve söz konusu denetim için doğrulamayı atlar. Başarılı bir onarımdan sonra doctor, onarılan bulgularla sınırlandırılmış `detect()` işlemini yeniden çalıştırır; bulgu hâlâ mevcutsa değişikliği tamamlanmış saymak yerine bir onarım uyarısı bildirir.

Bir bulgu şunları içerir:

| Alan              | Amaç                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Atlama/yalnızca filtreleri ve CI izin listeleri için kararlı kimlik. |
| `severity`        | `info`, `warning` veya `error`.                         |
| `message`         | İnsan tarafından okunabilir sorun açıklaması.          |
| `path`            | Mevcut olduğunda yapılandırma, dosya veya mantıksal yol. |
| `line` / `column` | Mevcut olduğunda kaynak konumu.                         |
| `ocPath`          | Bir denetim belirli bir adresi gösterebildiğinde kesin `oc://` adresi. |
| `fixHint`         | Önerilen operatör eylemi veya onarım özeti.             |

Modernleştirilmiş çekirdek doctor denetimleri, insanlara yönelik `doctor` / `doctor --fix` davranışlarının sahibi olan sıralı doctor katkısına bağlı kalır. Paylaşılan yapılandırılmış sağlık kayıt defteri genişletme noktasıdır: paketle birlikte gelen ve plugin destekli denetimler, sahip paketleri bunları etkin komut yoluna kaydettikten sonra çekirdek doctor denetimlerinin ardından çalışır. `openclaw/plugin-sdk/health`, plugin yazarlarına aynı sözleşmeyi sunar.

## Denetim seçimi

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` ve `--skip` tam denetim kimliklerini kabul eder ve yinelenebilir. Bir `--only` kimliği kayıtlı değilse bu kimlik için hiçbir denetim çalışmaz; odaklanmış bir geçidin beklediğiniz denetimleri seçtiğini doğrulamak için çıktıda `checksRun`/`checksSkipped` kullanın.

## Yükseltme sonrası modu

`openclaw doctor --post-upgrade`, bir derleme veya yükseltmenin ardından zincirleme çalıştırılmak üzere plugin uyumluluk yoklamalarını çalıştırır. Bulgular stdout'a gönderilir; herhangi bir bulguda `level: "error"` varsa çıkış kodu 1 olur. CI, topluluk `fork-upgrade` becerisi ve diğer yükseltme sonrası hızlı denetim araçları için uygun, makine tarafından okunabilir bir zarf (`{ probesRun, findings }`) elde etmek üzere `--json` ekleyin. Yüklü plugin dizini eksik veya hatalı biçimlendirilmişse JSON modu yine de `plugin.index_unavailable` hata bulgusunu içeren zarfı yayınlar.

Konteyner imajı başlatma işlemi, olağan "güncellemeden sonra doctor'ı
çalıştırın" akışının istisnasıdır. `openclaw gateway run` yeni bir OpenClaw sürümünde
başladığında hazır olduğunu bildirmeden önce güvenli durum ve plugin onarımlarını
çalıştırır. Onarım güvenle tamamlanamazsa başlatma işlemi sonlanır ve konteyneri
normal biçimde yeniden başlatmadan önce aynı bağlanmış durum/yapılandırmaya karşı
aynı imajı `openclaw doctor --fix` ile bir kez çalıştırmanızı söyler.

## Paylaşılan durum SQLite sıkıştırması

`openclaw doctor --state-sqlite compact`,
`<state-dir>/state/openclaw.sqlite` konumundaki kurallı paylaşılan durum veritabanı için
açık çevrimdışı bakımdır. İsteğe bağlı bir veritabanı yolunu kabul etmez,
normal Gateway işlemi tarafından hiçbir zaman çağrılmaz ve
`openclaw doctor --fix` kapsamına dahil değildir. Komut, Gateway başlatmasıyla aynı
durum sahipliği kilidini alır ve doğrulama, denetim noktası oluşturma, `VACUUM`
ve son bütünlük denetimleri boyunca bu kilidi tutar. Bir Gateway veya başka bir
SQLite bakım komutu bu kilidin sahibiyken çalışmayı reddeder. `OPENCLAW_ALLOW_MULTI_GATEWAY=1`,
yapılandırma başına Gateway tekil örneğini atlasa bile durum kilidi etkin kalır;
bu nedenle bakımın Gateway'i algılaması için operatör kabuğunun Gateway hizmetinin
ortamını devralması gerekmez.

Önce Gateway'i durdurun ve doğrulanmış bir yedek oluşturun:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Komut:

1. Kurallı paylaşılan durum yolunda normal bir dosya gerektirir. Eksik bir
   veritabanı `skipped` olarak bildirilir ve işlem başarıyla sonlanır.
2. Denetim noktası oluşturmadan veya dosyayı değiştirmeden önce desteklenen
   mevcut şema sürümünü ve `schema_meta.role = "global"` değerini doğrular.
3. Meşgul olmayan bir `wal_checkpoint(TRUNCATE)` gerektirir. Denetim noktası meşgulse
   kalan tüm OpenClaw süreçlerini durdurup yeniden deneyin.
4. `auto_vacuum` değerini `INCREMENTAL` olarak ayarlar, tam bir `VACUUM` çalıştırır
   ve yeniden denetim noktası oluşturur.
5. `quick_check`, `integrity_check` ve `foreign_key_check` işlemlerini çalıştırır, ardından
   yalnızca sahip izinlerini veritabanına ve SQLite yardımcı dosyalarına yeniden uygular.

JSON çıktısı, sıkıştırmadan önceki ve sonraki veritabanı ve WAL boyutlarını,
boş liste sayfalarını, sayfa boyutunu ve `auto_vacuum` değerini; ayrıca geri
kazanılan baytları ve `quick_check` ile `integrity_check` sonuçlarını bildirir.
`foreign_key_check` hata durumunda kapalı olacak şekilde zorunlu kılınır ve ayrı bir
başarı alanı yoktur. SQLite, `auto_vacuum` değerini yok için `0`,
tam için `1` ve artımlı için `2` olarak bildirir.

Şema eskiyse, çalışan OpenClaw derlemesinden yeniyse veya bir ajan veritabanına
aitse sıkıştırma değişiklik yapmadan başarısız olur. Eski bir paylaşılan durum
şeması için önce `openclaw doctor --fix` çalıştırın. Daha yeni bir şema için uyumlu
bir yedeği geri yükleyin veya OpenClaw'ı yükseltin.

## Oturum SQLite geçişi

OpenClaw, eski oturum satırlarını ve döküm geçmişini Gateway başlatması sırasında
ve `openclaw doctor --fix` sırasında her ajanın SQLite veritabanına otomatik olarak
aktarır. `openclaw doctor --session-sqlite <mode>`, bu geçişe yönelik
inceleme ve doğrulama aracıdır. Güncel çalışma zamanı oturum satırları
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` konumunda bulunur. Eski
`sessions.json` dosyaları geçiş kaynaklarıdır. Etkin döküm JSONL dosyaları
başarıyla içe aktarıldıktan sonra içe aktarılır ve etkin oturumlar dizininin
dışında arşivlenir; arşiv katmanındaki JSONL dosyaları çalışma zamanı geri
dönüşleri değil, destek yapıtları olarak kalır.

Modlar:

| Mod        | Davranış                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | İçe aktarmadan eski ve SQLite sayılarını, ayrıca başvurulmayan JSONL dosyalarını okur.                                  |
| `dry-run`  | Eski girdileri ve döküm JSONL dosyalarını ayrıştırır, içe aktarılabilir satırları sayar ve SQLite satırlarını yazmadan sorunları bildirir. |
| `import`   | Seçili hedefler için eski girdileri ve döküm olaylarını SQLite'a aktarır.                                               |
| `validate` | Seçili eski kaynakları SQLite satırları ve döküm olay sayılarıyla karşılaştırır.                                        |
| `compact`  | Büyük silme veya arşiv temizliğinden sonra boş sayfaları geri kazanmak için seçili ajan SQLite veritabanlarında denetim noktası oluşturur ve VACUUM çalıştırır. |
| `recover`  | En son başarısız geçiş çalışmasını geri yükler, hedeflerini doğrular ve temizlenmiş bir GitHub sorun raporu hazırlar.    |
| `restore`  | Kayıtlı geçiş bildirimlerinden arşivlenmiş döküm yapıtlarını SQLite verilerini silmeden geri yükler.                    |

Seçiciler:

- Varsayılan: söz konusu eski depo dosyası mevcutsa yapılandırılmış varsayılan ajan deposu.
- `--session-sqlite-agent <id>`: yapılandırılmış tek bir ajan.
- `--session-sqlite-all-agents`: yapılandırılmış ajan depoları ve keşfedilen ajan depoları.
- `--session-sqlite-store <path>`: açıkça belirtilmiş tek bir eski `sessions.json` yolu.

Elle inceleme sırası:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Önemli geçmiş içeren bir kurulumda `import` çalıştırmadan önce OpenClaw
durum dizinini yedekleyin. Seçili eski bir girdi SQLite'ta eksik olduğunda, bir
oturum kimliği farklı olduğunda veya bir döküm olay sayısı farklı olduğunda
`validate` sıfırdan farklı bir kodla sonlanır. `--session-sqlite-store <path>` kullanırken
raporun beklenen hedef sayısını içerdiğini kontrol edin; mevcut olmayan, açıkça
belirtilmiş bir depo yolu hiçbir hedef seçmez.

SQLite silme işlemleri önce veritabanı içindeki sayfaları geri kazanır; veritabanı
dosyasını hemen küçültmeleri gerekmez. Büyük dökümleri sildikten veya arşivledikten
sonra WAL dosyalarında denetim noktası oluşturmak, `VACUUM` çalıştırmak
ve önceki/sonraki veritabanı ile WAL boyutlarını bildirmek için
`openclaw doctor --session-sqlite compact --session-sqlite-all-agents` çalıştırın. Sıkıştırma; güncel ajan şemasına sahip normal bir
dosya, seçili ajanın kalıcı sahip meta verileri ve doctor sürecinde açık tanıtıcı
bulunmamasını gerektirir. Yıkıcı `import`, `compact`,
`recover` ve `restore` modları, tüm işlemleri boyunca Gateway
başlatmasıyla aynı durum sahipliği kilidini tutar; `inspect`,
`dry-run` ve `validate` salt okunur kalır ve bu kilidi almaz.
Önce Gateway'i durdurun. Yıkıcı modlar, canlı yazma işlemleriyle veya başka bir
bakım komutuyla yarışmak yerine başarısız olur. Yıkıcı bir `--session-sqlite-store`
hedefi etkin durum dizininin içinde olmalıdır; başka bir kurulumun bakımını
yapmadan önce `OPENCLAW_STATE_DIR` değerini deponun sahibi olan durum dizinine
ayarlayın. Mevcut sabit bağlantılı hedefler reddedilir çünkü başka bir yol,
kilitli durum dizininin dışında aynı veritabanı inode'unu paylaşabilir. Aynı
sahiplik denetimleri SQLite WAL, paylaşılan bellek ve geri alma günlüğü yardımcı
dosyalarını da kapsar.

Her içe aktarma, döküm yapıtlarını arşive taşımadan önce
`~/.openclaw/session-sqlite-migration-runs/` altında bir bildirim yazar. Başlatma işlemi, yapıtlar
taşındıktan sonra başarısız bir oturum SQLite geçişi bildirirse kurtarmayı
çalıştırın:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Kurtarma en son başarısız geçiş bildirimini seçer, yalnızca bildirimin arşivlenmiş
yapıtlarını geri yükler, etkilenen hedefleri doğrular, temizlenmiş
`.failure.md` ve `.failure.json` raporlarını yeniler ve döküm içeriklerini,
ham ortamı, gizli bilgileri ve sınırsız yapılandırmayı içermeyen bir GitHub sorun
gövdesi hazırlar. Başarısız geçiş bildirimi bulunmadığında ancak seçili bir ajan
SQLite veritabanı bozuk olduğunda, veritabanı olmadığında veya ana veritabanı
olmadan günlük yardımcı dosyalarına sahip olduğunda kurtarma, dosya kümesinin
tamamını geçici bir inceleme dizinine kopyalar. SQLite, özgün adli inceleme
dosyalarına dokunulmadan önce bu tek kullanımlık kopyadaki geçerli bir etkin
günlüğü geri alabilir; ardından `quick_check`, `integrity_check` ve
`foreign_key_check` çalışır. Başarısız bütünlük denetimleri veya sahipsiz yardımcı
dosyalar, keşfedilen kümenin tamamını tek bir `.corrupt-<timestamp>` son ekiyle
yeniden adlandırarak DB, WAL, SHM ve geri alma günlüğü dosyalarını korur.
Yakalanan bir yeniden adlandırma hatası, başarısızlığı bildirmeden önce taşınmış
dosyaları geri alır; böylece kurtarılabilir bir dosya kümesi sessizce bölünmez.
Kurtarmadan önce Gateway'i durdurun; etkin biçimde değişen bir SQLite dosya
kümesini kopyalamak veya yeniden adlandırmak güvenli değildir ve işletim
sistemleri arasında farklı davranır. `--github-issue --yes` ile doctor, GitHub
CLI'ı kullanarak `openclaw/openclaw` içinde sorunu oluşturur; onay olmadan yerel
destek raporunu yazar ve önceden doldurulmuş bir sorun URL'si yazdırır.

`restore`, daha düşük düzeyli geri alma işlemi olarak kalır. Bildirim
`sourcePath -> archivePath` kayıtlarını kullanır, arşivlenmiş yapıtları yalnızca özgün
yol eksik olduğunda geri taşır, her iki yol da mevcut olduğunda çakışmaları
bildirir ve SQLite veritabanını yerinde bırakır.

### Oturum SQLite Geçişinden Sonra Eski Sürüme Dönme

Dosya destekli eski bir OpenClaw sürümünü başlatmadan önce arşivlenmiş eski
döküm yapıtlarını geri yükleyin:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Eski sürümler, `sessions.json` girdilerini ve bu girdilerde kaydedilen `sessionFile` yollarını
okur. SQLite geçişinden sonra başarılı içe aktarmalar, etkin JSONL
transkriptlerini `session-sqlite-import-archive/` içine taşır; bu nedenle geri yükleme, manifestte kaydedilmiş bu yapıtları
özgün yollarına geri taşıyana kadar eski çalışma zamanı bu geçmişi
göremez.

Geri yükleme SQLite verilerini silmez. SQLite'a geçişten sonra oluşturulan oturumlar
yalnızca SQLite'ta bulunur ve eski çalışma zamanında görünmez. Daha sonra
yeniden yükseltirseniz OpenClaw'ın içe aktarmadan önce geri yüklenen eski yapıtları
SQLite satırlarıyla karşılaştırabilmesi için yukarıdaki normal geçiş doğrulama sırasını çalıştırın.

## Notlar

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor denetimleri çalışmaya devam eder ancak `openclaw.json` değiştirilemez olduğundan `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulumun Nix kaynağını düzenleyin; nix-openclaw için önce agent yaklaşımını kullanan [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu kullanın.
- Etkileşimli istemler (anahtar zinciri/OAuth düzeltmeleri vb.) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmadığında** çalışır. Başsız çalıştırmalar (cron, Telegram, terminal yok) istemleri atlar.
- Etkileşimsiz `doctor` çalıştırmaları, başsız sistem durumu denetimlerinin hızlı kalması için önceden Plugin yüklemeyi atlar. Etkileşimli oturumlar, eski sistem durumu/onarım akışının gerektirdiği Plugin yüzeylerini yüklemeye devam eder.
- `--lint`, `--non-interactive` seçeneğinden daha katıdır: her zaman salt okunurdur, hiçbir zaman istem göstermez ve güvenli geçişleri hiçbir zaman uygulamaz. Doctor'ın değişiklik yapmasını istediğinizde `doctor --fix` veya `doctor --repair` kullanın.
- Doctor, gizli değerleri denetlerken varsayılan olarak `exec` SecretRef'lerini yürütmez. Yalnızca doctor'ın yapılandırılmış gizli değer çözümleyicilerini çalıştırmasını bilinçli olarak istediğinizde `--allow-exec` seçeneğini (`--lint` ile veya onsuz) kullanın.
- Herhangi bir yapılandırma yazma işlemi (`--fix` onarımı dâhil), yedeği `~/.openclaw/openclaw.json.bak` konumuna döndürür (numaralandırılmış `.bak.1`..`.bak.4` halkasıyla). `--fix` ayrıca şema doğrulamasının bildirdiği bilinmeyen yapılandırma anahtarlarını kaldırır ve kaldırılanların her birini listeler; kısmen yazılmış yükseltme durumu, geçişi tamamlanmadan kaldırılmasın diye güncelleme sürerken bu işlemi atlar.
- Gateway yaşam döngüsünü başka bir gözetmen yönetiyorsa `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor, Gateway/hizmet durumunu bildirmeye ve hizmet dışı onarımları uygulamaya devam eder ancak hizmet kurma/başlatma/yeniden başlatma/önyükleme işlemlerini ve eski hizmet temizliğini atlar.
- Linux'ta doctor, etkin olmayan ek Gateway benzeri systemd birimlerini yok sayar ve onarım sırasında çalışan bir systemd Gateway hizmetinin komut/giriş noktası meta verilerini yeniden yazmaz. Önce hizmeti durdurun veya etkin başlatıcıyı değiştirmek için `openclaw gateway install --force` kullanın.
- `doctor --fix --non-interactive`, eksik veya güncelliğini yitirmiş Gateway hizmeti tanımlarını bildirir ancak güncelleme onarım modu dışında bunları kurmaz ya da yeniden yazmaz. Eksik bir hizmet için `openclaw gateway install`, başlatıcıyı değiştirmek için ise `openclaw gateway install --force` çalıştırın.
- Durum bütünlüğü denetimleri, oturumlar dizinindeki sahipsiz transkript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve başsız çalıştırmalar bunları yerinde bırakır.
- Doctor, eski cron işi biçimlerini bulmak için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve standart satırları SQLite'a aktarmadan önce bunları yeniden yazar.
- Doctor, açık bir `payload.model` geçersiz kılması bulunan cron işlerini; sağlayıcı ad alanı sayıları ve `agents.defaults.model` ile uyuşmazlıklar dâhil olmak üzere bildirir. Böylece varsayılan modeli devralmayan zamanlanmış işler, kimlik doğrulama veya faturalandırma incelemeleri sırasında görülebilir.
- Doctor, hâlâ devam ediyor olarak işaretlenen (`state.runningAtMs`) cron işlerini bildirir; bu durum `openclaw cron list` içinde bunların `running` olarak görünmesine neden olabilir. Bu denetim salt okunurdur: işaretlenmiş bir işi şu anda hiçbir Gateway yürütmüyorsa sonraki cron hizmeti başlangıcı kesintiye uğrayan çalıştırmayı kaydeder ve işareti temizler.
- Linux'ta doctor, kullanıcının crontab'i hâlâ bakımı yapılmayan eski `~/.openclaw/bin/ensure-whatsapp.sh` komutunu çalıştırdığında uyarır; cron, systemd kullanıcı veri yolu ortamına sahip olmadığında bu komut `Gateway inactive` durumunu yanlış bildirebilir.
- WhatsApp etkinleştirildiğinde doctor, yerel `openclaw-tui` istemcileri çalışmaya devam ederken performansı düşmüş bir Gateway olay döngüsü olup olmadığını denetler. `doctor --fix`, WhatsApp yanıtlarının güncelliğini yitirmiş TUI yenileme döngülerinin arkasında kuyruğa alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor; birincil modeller, geri dönüşler, model izin listeleri, görüntü/video oluşturma modelleri, Heartbeat/alt agent/Compaction geçersiz kılmaları, kancalar, kanal modeli geçersiz kılmaları, cron yükleri ve güncelliğini yitirmiş oturum/transkript rota sabitlemeleri genelindeki eski `codex/*` ve `openai-codex/*` model başvurularını standart `openai/*` başvuruları olarak yeniden yazar. `--fix` ayrıca güvenli olduğunda eski `models.providers.codex` ve `models.providers.openai-codex` yapılandırmalarını birleştirir, eski `openai-codex:*` kimlik doğrulama profillerini ve `auth.order.openai-codex` girdilerini `openai:*` konumuna geçirir, Codex amacını sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine taşır, güncelliğini yitirmiş tüm-agent/oturum çalışma zamanı sabitlemelerini kaldırır ve onarılan OpenAI agent başvurularını doğrudan OpenAI API anahtarı kimlik doğrulaması yerine Codex kimlik doğrulama yönlendirmesinde tutar.
- Doctor, başvurulan profillerin tamamı kaldırılmış olmasına rağmen uyumlu saklanmış kimlik bilgilerinin bulunduğu, boş olmayan `auth.order.<provider>` listelerini bildirir. `doctor --fix` yalnızca güncelliğini yitirmiş bu geçersiz kılmaları silerek agent başına otomatik kimlik bilgisi seçimini geri yükler; açıkça boş sıralamalar, kısmen geçerli listeler ve uyumlu saklanmış kimlik bilgisi bulunmayan sıralamalar değişmeden kalır. Etkin bir SQLite kimlik doğrulama deposu okunamıyorsa veya bozuksa doctor bu onarımı neden atladığını açıklar. Yapılandırma yeniden yükleme modu yazma işlemini otomatik olarak uygulamıyorsa kimlik doğrulama durumunu yeniden denetlemeden önce çalışan Gateway'i yeniden başlatın.
- Doctor, eski OpenClaw sürümlerinden kalan eski Plugin bağımlılığı hazırlama durumunu temizler ve eş bağımlılık olarak bildiren yönetilen npm Plugin'leri için ana makinenin `openclaw` paketini yeniden bağlar. Ayrıca yapılandırmanın başvurduğu eksik indirilebilir Plugin'leri (`plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları, yapılandırılmış agent çalışma zamanları) onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar paket yöneticisi Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa daha sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve bir sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklı olduğunda eksik Plugin kimliklerini `plugins.allow`/`plugins.deny`/`plugins.entries` alanlarından ve bunlarla eşleşen sahipsiz kanal yapılandırmasından, Heartbeat hedeflerinden ve kanal modeli geçersiz kılmalarından kaldırarak güncelliğini yitirmiş Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakıp geçersiz `config` yükünü kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlangıcı zaten yalnızca bu hatalı Plugin'i atladığından diğer Plugin'ler ve kanallar çalışmaya devam eder.
- Doctor, kullanımdan kaldırılan `plugins.entries.codex.config.codexDynamicToolsProfile` öğesini kaldırır; Codex app-server, Codex'e özgü çalışma alanı araçlarını her zaman yerel olarak tutar.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` biçimine geçirir. Tek fark nesne anahtarı sırası olduğunda yinelenen `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor, bir bellek arama hazırlık denetimi içerir ve gömme kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, hiçbir komut sahibi yapılandırılmadığında uyarır. Komut sahibi, yalnızca sahibin kullanabildiği komutları çalıştırmasına ve tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin botla konuşmasına izin verir; ilk sahip önyüklemesi kullanıma sunulmadan önce bir göndericiyi onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modlu agent'lar yapılandırıldığında ve operatörün Codex ana dizininde kişisel Codex CLI varlıkları bulunduğunda bir bilgi notu bildirir. Yerel Codex app-server başlatmaları, agent başına yalıtılmış ana dizinler kullanır; gerekirse önce Codex Plugin'ini kurun, ardından bilinçli olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate plan codex` kullanın.
- Doctor, varsayılan agent için izin verilen Skills mevcut çalışma zamanı ortamında kullanılamadığında (eksik ikili dosyalar, ortam değişkenleri, yapılandırma veya işletim sistemi gereksinimleri) uyarır. `doctor --fix`, kullanılamayan bu Skills öğelerini `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; Skills öğesini etkin tutmak istiyorsanız bunun yerine eksik gereksinimi kurun/yapılandırın.
- Korumalı alan modu etkin ancak Docker kullanılamıyorsa doctor, düzeltme adımlarıyla (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) birlikte yüksek önem taşıyan bir uyarı bildirir.
- Eski korumalı alan kayıt defteri dosyaları veya parça dizinleri (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` veya `~/.openclaw/sandbox/browsers/`) mevcutsa doctor bunları bildirir; `--fix` geçerli girdileri SQLite'a geçirir ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password`, SecretRef tarafından yönetiliyorsa ve geçerli komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin geri dönüş kimlik bilgileri yazmaz. Yürütme tabanlı SecretRef'ler için doctor, `--allow-exec` mevcut olmadığı sürece yürütmeyi atlar.
- Bir düzeltme yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini geçişlerinden sonra doctor, etkin varsayılan Telegram veya Discord hesapları ortam geri dönüşüne bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` ya da `DISCORD_BOT_TOKEN` doctor işlemi tarafından kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adının otomatik çözümlenmesi (`doctor --fix`), geçerli komut yolunda çözümlenebilir bir Telegram token'ı gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçişte otomatik çözümlemeyi atlar.

## macOS: `launchctl` ortam geçersiz kılmaları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız bu değer, yapılandırma dosyanızı geçersiz kılar ve kalıcı "yetkisiz" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
