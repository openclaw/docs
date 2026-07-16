---
read_when:
    - Arka plan işlerini veya uyandırmaları zamanlama
    - Harici tetikleyicileri (webhook'lar, Gmail) OpenClaw'a bağlama
    - Zamanlanmış görevler için Heartbeat ile Cron arasında seçim yapma
sidebarTitle: Scheduled tasks
summary: Gateway zamanlayıcısı için zamanlanmış işler, webhook'lar ve Gmail PubSub tetikleyicileri
title: Zamanlanmış görevler
x-i18n:
    generated_at: "2026-07-16T16:48:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway'in yerleşik zamanlayıcısıdır. İşleri kalıcı olarak saklar, agent'ı doğru zamanda uyandırır ve çıktıyı bir sohbet kanalına, Webhook'a iletebilir ya da hiçbir yere iletmeyebilir.

## Hızlı başlangıç

<Steps>
  <Step title="Tek seferlik bir hatırlatıcı ekleyin">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: cron belgeleri taslağını kontrol edin" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="İşlerinizi kontrol edin">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Çalıştırma geçmişini görüntüleyin">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron nasıl çalışır?

- Cron, modelin içinde değil, **Gateway işleminin içinde** çalışır. Zamanlamaların tetiklenmesi için Gateway çalışıyor olmalıdır.
- İş tanımları, çalışma zamanı durumu ve çalıştırma geçmişi OpenClaw'ın paylaşılan SQLite durum veritabanında kalıcı olarak saklanır; dolayısıyla yeniden başlatmalar zamanlamaların kaybolmasına neden olmaz.
- Her cron yürütmesi bir [arka plan görevi](/tr/automation/tasks) kaydı oluşturur.
- Tek seferlik işler (`--at`) başarılı olduktan sonra varsayılan olarak otomatik silinir; bunları saklamak için `--keep-after-run` belirtin.
- Çalıştırma başına geçen süre bütçesi: ayarlandığında `--timeout-seconds`. Aksi takdirde, yalıtılmış/ayrılmış agent turu işleri, temel agent turu zaman aşımı (`agents.defaults.timeoutSeconds`, varsayılan 48 saat) uygulanmadan önce cron'un kendi 60 dakikalık gözetim süresiyle sınırlandırılır; komut işlerinin varsayılan süresi 10 dakikadır.
- Gateway başlatıldığında, süresi geçmiş yalıtılmış agent turu işleri hemen yeniden oynatılmak yerine yeniden zamanlanır; böylece model/araç önyükleme çalışmaları kanal bağlantısı penceresinin dışında tutulur.
- Sistem cron'undan veya başka bir harici zamanlayıcıdan `openclaw agent` çalıştırıyorsanız, CLI zaten `SIGTERM`/`SIGINT` işlemlerini gerçekleştirse de bunu zorla sonlandırma yükseltmesiyle sarmalayın. Gateway destekli çalıştırmalar, kabul edilen çalıştırmaları iptal etmesini Gateway'den ister; yerel ve gömülü yedek çalıştırmalar da aynı iptal sinyalini alır. GNU `timeout` için düz `timeout 600 ...` yerine `timeout -k 60 600 openclaw agent ...` tercih edin — işlem zamanında kapanamazsa `-k` değeri son güvence olarak kullanılır. systemd birimleri için son zorla sonlandırmadan önce ek süre penceresiyle (`TimeoutStopSec`) birlikte bir `SIGTERM` durdurma sinyali kullanın. Özgün Gateway çalıştırması hâlâ etkinken bir `--run-id` yeniden kullanılırsa ikinci bir çalıştırma başlatmak yerine yinelenen çalıştırmanın devam ettiği bildirilir.

<AccordionGroup>
  <Accordion title="Yalıtılmış çalıştırmayı sağlamlaştırma">
    - Yalıtılmış çalıştırmalar, tamamlandıklarında `cron:<jobId>` oturumları için izlenen tarayıcı sekmelerini/işlemlerini mümkün olduğunca kapatır ve iş için oluşturulan tüm paketlenmiş MCP çalışma zamanı örneklerini ana oturum ve özel oturum çalıştırmalarında kullanılan aynı paylaşılan kapatma yolu üzerinden sonlandırır. Cron sonucunun geçerli kalması için temizleme hataları yok sayılır.
    - Dar kapsamlı cron öz temizleme iznine sahip yalıtılmış çalıştırmalar; zamanlayıcı durumunu, yalnızca kendi işlerini içeren kendilerine göre filtrelenmiş bir listeyi ve söz konusu işin çalıştırma geçmişini okuyabilir ve yalnızca kendi işlerini kaldırabilir.
    - Yalıtılmış çalıştırmalar eski onay yanıtlarına karşı koruma sağlar: ilk sonuç yalnızca geçici bir durum güncellemesiyse (`on it`, `pulling everything together` ve benzeri ipuçları) ve hiçbir alt agent nihai yanıttan hâlâ sorumlu değilse OpenClaw, teslimattan önce gerçek sonucu almak için bir kez daha istem gönderir.
    - Yapılandırılmış yürütme reddi meta verileri (iç içe hatası `SYSTEM_RUN_DENIED` veya `INVALID_REQUEST` ile başlayan Node ana bilgisayarı `UNAVAILABLE` sarmalayıcıları dâhil) tanınır; böylece engellenen bir komut başarılı bir çalıştırma olarak bildirilmezken sıradan asistan metni de yanlışlıkla ret olarak değerlendirilmez.
    - Yanıt yükü olmasa bile çalıştırma düzeyindeki agent hataları iş hatası sayılır; böylece model/sağlayıcı hataları, işin başarılı olarak temizlenmesi yerine hata sayaçlarını artırır ve başarısızlık bildirimlerini tetikler.
    - Bir iş `timeoutSeconds` değerine ulaştığında cron çalıştırmayı iptal eder ve kısa bir temizleme süresi tanır. Çalıştırma bu sürede kapanmazsa Gateway'in yönettiği temizleme, cron zaman aşımını kaydetmeden önce bu çalıştırmanın oturum sahipliğini zorla temizler; böylece kuyruktaki sohbet çalışmaları eski bir işlem oturumunun arkasında takılı kalmaz.
    - Kurulum/başlatma takılmaları aşamaya özgü bir zaman aşımına tabi olur (örneğin `cron: isolated agent setup timed out before runner start` veya `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Bu gözetimler, harici CLI işlemleri başlamadan önce bile gömülü ve CLI destekli sağlayıcıları kapsar ve uzun `timeoutSeconds` değerlerinden bağımsız olarak sınırlandırılır; böylece soğuk başlatma/kimlik doğrulama/bağlam hataları hızla ortaya çıkar.

  </Accordion>
  <Accordion title="Görev uzlaştırma">
    Cron görev uzlaştırmasının birincil sahibi çalışma zamanıdır, ikincil dayanağı ise kalıcı geçmiştir: cron çalışma zamanı ilgili işi hâlâ çalışıyor olarak izlediği sürece, eski bir alt oturum satırı mevcut olsa bile etkin cron görevi devam eder. Çalışma zamanı işin sahipliğini bıraktıktan ve 5 dakikalık ek süre penceresi dolduktan sonra bakım kontrolleri, eşleşen `cron:<jobId>:<startedAt>` çalıştırması için kalıcı çalıştırma günlüklerini ve iş durumunu denetler. Buradaki nihai sonuç görev defterini sonlandırır; aksi takdirde Gateway tarafından yönetilen bakım, görevi `lost` olarak işaretleyebilir. Çevrimdışı CLI denetimi kalıcı geçmişten kurtarma yapabilir ancak kendi boş işlem içi etkin iş kümesi, Gateway tarafından yönetilen bir çalıştırmanın sona erdiğinin kanıtı değildir.
  </Accordion>
</AccordionGroup>

## Zamanlama türleri

| Tür       | CLI bayrağı  | Açıklama                                                                                                 |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Tek seferlik zaman damgası (ISO 8601 veya `20m` gibi göreli bir değer)                                   |
| `every`   | `--every`   | Sabit aralık (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | İsteğe bağlı `--tz` içeren 5 alanlı veya 6 alanlı cron ifadesi                                         |
| `on-exit` | `--on-exit` | İzlenen bir komut sonlandığında bir kez tetiklenir (olay tetikleyicisi; tur kapatıldıktan sonra etkin kalır; isteğe bağlı `--on-exit-cwd`) |

Saat dilimi içermeyen zaman damgaları UTC olarak değerlendirilir. Saat dilimi farkı içermeyen bir `--at` tarih-saat değerini bu IANA saat diliminde yorumlamak veya bir cron ifadesini bu saat diliminde değerlendirmek için `--tz America/New_York` ekleyin. `--tz` içermeyen cron ifadeleri Gateway ana bilgisayarının saat dilimini kullanır. `--tz`, `--every` veya `--on-exit` ile geçerli değildir.

Saat başında yinelenen ifadeler (joker karakterli saat alanıyla birlikte dakika `0`) yük artışlarını azaltmak amacıyla otomatik olarak en fazla 5 dakika aralığa dağıtılır. Kesin zamanlamayı zorlamak için `--exact`, açık bir pencere belirtmek için ise `--stagger 30s` kullanın (yalnızca cron zamanlamaları).

### Ayın günü ve haftanın günü VEYA mantığını kullanır

Cron ifadeleri [croner](https://github.com/Hexagon/croner) tarafından ayrıştırılır. Hem ayın günü hem de haftanın günü alanları joker karakter olmadığında croner, iki alan birden değil, **alanlardan herhangi biri** eşleştiğinde eşleşme kabul eder. Bu, standart Vixie cron davranışıdır.

```bash
# Amaçlanan: "Yalnızca pazartesi gününe denk gelirse ayın 15'inde saat 09.00"
# Gerçek:    "Her ayın 15'inde saat 09.00 VE her pazartesi saat 09.00"
0 9 15 * 1
```

Bu, ayda 0-1 kez yerine yaklaşık 5-6 kez tetiklenir. Her iki koşulu da zorunlu kılmak için croner'ın `+` haftanın günü değiştiricisini (`0 9 15 * +1`) kullanın veya alanlardan birine göre zamanlayıp diğerini işinizin isteminde ya da komutunda denetleyin.

## Olay tetikleyicileri (koşul izleyicileri)

Olay tetikleyicisi, bir `every` veya `cron` zamanlamasına kullanıcı arayüzü gerektirmeyen bir koşul betiği ekler. Cron, işin zamanı geldiğinde betiği değerlendirir ve normal yükü yalnızca betik `fire: true` döndürdüğünde çalıştırır:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Yalnızca gözlemlenen durum son değerlendirmeden farklı olduğunda tetiklenir.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "CI durum değişikliğini araştırın." },
}
```

Betik `{ fire, message?, state? }` döndürmelidir. Önceki JSON durumu, derinlemesine dondurulmuş `trigger.state` olarak kullanılabilir; kalıcı olarak saklamak için yeni bir `state` değeri döndürün. Durum 16 KB ile sınırlıdır. Tetiklenen bir sonuç `message` içerdiğinde cron, yürütmeden önce bunu sistem olayı metnine veya agent turu iletisine ekler. `once: true`, ilk başarılı tetiklenmiş yükünden sonra işi devre dışı bırakır.

`fire: false`, değerlendirme durumunu ve sayaçları kalıcı olarak saklar, ardından çalıştırma geçmişi oluşturmadan yeniden zamanlar. Tetiklenmiş yük çalıştırması başarısız olursa döndürülen `state` **kalıcı olarak saklanmaz** — sonraki değerlendirme önceki durumu görür ve yeniden tetiklenebilir; bu nedenle betikleri salt okunur kontroller olarak yazın ve eylemleri yükte tutun. Tetikleyici zamanlamalarının yapılandırılabilir bir minimum aralığı vardır (varsayılan olarak 30 saniye). Her değerlendirme 30 saniyelik geçen süre bütçesine ve en fazla 5 araç çağrısına sahiptir.

<Warning>
`cron.triggers.enabled` özelliğinin etkinleştirilmesi, agent tarafından yazılmış betiklerin sahip agent'ın **`exec` dâhil olmak üzere tam araç politikasıyla** kullanıcı arayüzü gerektirmeden çalışmasına izin verir. Bunu, söz konusu agent'ın izinlarıyla gözetimsiz kod yürütme olarak değerlendirin; cron işleri oluşturmasına izin verilen her agent bu doğrultuda güvenilir değilse devre dışı bırakın.
</Warning>

Yerel bir betik dosyasından izleyici oluşturun (`-` betiği standart girdiden okur):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "CI durum değişikliğine yanıt verin" \
  --session isolated
```

## Yükler

Her iş, bayrakla seçilen tam olarak bir yük türü taşır:

| Yük           | Bayrak                                         | Çalıştırdığı işlem                                      |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Sistem olayı  | `--system-event <text>`                        | Ana oturuma kuyruğa alınır; tek başına model çağrısı yapmaz |
| Agent iletisi | `--message <text>`                             | Model destekli bir agent turu                           |
| Komut         | `--command <shell>` veya `--command-argv <json>` | Gateway ana bilgisayarında bir kabuk/işlem; model çağrısı yapmaz |

### Agent turu seçenekleri

<ParamField path="--message" type="string" required>
  İstem metni (yalıtılmış/geçerli/özel oturum işleri için gereklidir).
</ParamField>
<ParamField path="--model" type="string">
  Model geçersiz kılma; izin verilen bir modele çözümlenmelidir, aksi takdirde çalıştırma bir doğrulama hatasıyla başarısız olur.
</ParamField>
<ParamField path="--fallbacks" type="string">
  İş başına yedek model listesi, örneğin `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Yedekler olmadan katı bir çalıştırma için `--fallbacks ""` iletin.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` üzerinde, iş başına yedek geçersiz kılmayı kaldırarak işin yapılandırılmış yedek önceliğini izlemesini sağlar. `--fallbacks` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` üzerinde, iş başına model geçersiz kılmayı kaldırarak işin normal cron model önceliğini (saklanan cron oturumu geçersiz kılması, yoksa agent/varsayılan model) izlemesini sağlar. `--model` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="--thinking" type="string">
  Düşünme düzeyi geçersiz kılması (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Kullanılabilir düzeyler yine seçilen modele ve agent çalışma zamanına bağlıdır.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` üzerinde, iş başına düşünme geçersiz kılmasını kaldırır. `--thinking` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Çalışma alanı önyükleme dosyası eklemeyi atla.
</ParamField>
<ParamField path="--tools" type="string">
  İşin kullanabileceği araçları kısıtla, örneğin `--tools exec,read`.
</ParamField>

`--model` işin birincil modelini ayarlar; bir oturumun `/model` geçersiz kılmasını değiştirmez, dolayısıyla yapılandırılmış yedek zincirleri bunun üzerine uygulanmaya devam eder. Çözümlenemeyen veya izin verilmeyen bir model, sessizce varsayılana dönmek yerine çalıştırmanın açık bir doğrulama hatasıyla başarısız olmasına neden olur. Bir işte `--model` varsa ancak açık veya yapılandırılmış bir yedek listesi yoksa OpenClaw, agent birincil modelini gizli bir yeniden deneme hedefi olarak sessizce eklemek yerine boş bir yedek geçersiz kılması iletir.

Yalıtılmış işler için model seçimi önceliği, en yüksekten başlayarak:

1. İş başına yük `model` (açık yapılandırma; izin verilmeyen bir model çalıştırmanın başarısız olmasına neden olur)
2. Gmail kancası model geçersiz kılması (yalnızca çalıştırma Gmail'den geldiyse ve bu geçersiz kılmaya izin veriliyorsa)
3. Kullanıcının seçtiği saklanan cron oturumu model geçersiz kılması
4. Agent/varsayılan model seçimi

Hızlı mod, çözümlenen canlı seçimi izler. Seçilen model yapılandırmasında `params.fastMode` varsa yalıtılmış cron bunu varsayılan olarak kullanır; saklanan bir oturum `fastMode` geçersiz kılması (ardından bir agent `fastModeDefault`) her iki yönde de model yapılandırmasına üstün gelmeye devam eder. Otomatik mod, modelin `params.fastAutoOnSeconds` kesme değerini kullanır; varsayılan değer 60 saniyedir.

Bir çalıştırma canlı model değiştirme devrine ulaşırsa cron, geçiş yapılan sağlayıcı/model ile yeniden dener ve bu seçimi (ve varsa yeni kimlik doğrulama profilini) etkin çalıştırma için kalıcılaştırır. Yeniden denemeler sınırlıdır: ilk denemeden ve 2 geçiş yeniden denemesinden sonra cron döngüye girmek yerine işlemi iptal eder.

Yalıtılmış bir çalıştırma başlamadan önce OpenClaw, `baseUrl` değeri geri döngü, özel ağ veya `.local` olan yapılandırılmış `api: "ollama"` ve `api: "openai-completions"` sağlayıcılarının erişilebilir yerel uç noktalarını denetler. Bu ön kontrol, işin yapılandırılmış yedek zincirini dolaşır ve çalıştırmayı yalnızca tüm adaylara erişilemediğinde `skipped` olarak işaretler; `--fallbacks ""` bu dolaşımı katı biçimde yalnızca birincil modelle sınırlar. Çalışmayan bir uç nokta, model çağrısı başlatmak yerine çalıştırmayı açık bir hatayla `skipped` olarak kaydeder. Sonuç, iş veya model başına değil uç nokta başına 5 dakika önbelleğe alınır; böylece çalışmayan aynı yerel Ollama/vLLM/SGLang/LM Studio sunucusunu paylaşan çok sayıda zamanı gelmiş iş, istek fırtınası yerine tek bir yoklama maliyeti oluşturur. Ön kontrol nedeniyle atlanan çalıştırmalar yürütme hatası geri çekilme sayacını artırmaz; yinelenen atlama uyarılarını etkinleştirmek için `failureAlert.includeSkipped` ayarlayın.

### Komut yükleri

Komut yükleri, model destekli bir tur başlatmadan Gateway zamanlayıcısında deterministik betikler çalıştırır. Gateway ana makinesinde yürütülür, stdout/stderr çıktısını yakalar, çalıştırmayı cron geçmişine kaydeder ve agent turu işleriyle aynı `announce`, `webhook` ve `none` teslim modlarını yeniden kullanır.

<Note>
Komut cron'u, agent `tools.exec` çağrısı değil, operatör-yönetici Gateway otomasyon yüzeyidir. Cron işleri oluşturmak, güncellemek, kaldırmak veya elle çalıştırmak `operator.admin` gerektirir; zamanlanmış komut çalıştırmaları daha sonra Gateway işlemi içinde yönetici tarafından yazılmış bu otomasyon olarak yürütülür. Agent exec ilkesi (`tools.exec.mode`, onay istemleri, agent başına araç izin listeleri) komut cron yüklerini değil, modele görünür exec araçlarını yönetir.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`, `argv: ["sh", "-lc", <shell>]` depolar. Kabuk ayrıştırması olmadan tam argv yürütmesi için `--command-argv '["node","scripts/report.mjs"]'` kullanın. İsteğe bağlı `--command-env KEY=VALUE` (tekrarlanabilir), `--command-input`, `--timeout-seconds` (varsayılan 10 dakika), `--no-output-timeout-seconds` ve `--output-max-bytes`; işlem ortamını, stdin'i ve çıktı sınırlarını denetler.

Teslim edilen metin işlem çıktısından türetilir: boş olmayan stdout önceliklidir; stdout boş ve stderr boş değilse stderr teslim edilir; ikisi de varsa cron küçük bir `stdout:` / `stderr:` bloğu gönderir. `0` çıkış kodu çalıştırmayı `ok` olarak kaydeder; sıfır olmayan çıkış, sinyal, zaman aşımı veya çıktı yok zaman aşımı `error` olarak kaydedilir ve başarısızlık uyarılarını tetikleyebilir. Yalnızca `NO_REPLY` yazdıran bir komut, normal cron sessiz belirteç bastırmasını kullanır ve sohbete hiçbir şey göndermez.

## Yürütme stilleri

| Stil            | `--session` değeri | Çalıştığı yer            | En uygun olduğu durumlar        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Ana oturum      | `main`              | Ayrılmış cron uyandırma hattı | Hatırlatıcılar, sistem olayları |
| Yalıtılmış      | `isolated`          | Ayrılmış `cron:<jobId>` | Raporlar, arka plan işleri      |
| Geçerli oturum  | `current`           | Oluşturma sırasında bağlanır | Bağlama duyarlı yinelenen işler |
| Özel oturum     | `session:custom-id` | Kalıcı adlandırılmış oturum | Geçmişi temel alan iş akışları |

<AccordionGroup>
  <Accordion title="Ana oturum, yalıtılmış ve özel oturum karşılaştırması">
    **Ana oturum** işleri, cron'a ait bir çalıştırma hattına sistem olayı ekler ve isteğe bağlı olarak heartbeat'i uyandırır (`--wake now` veya `--wake next-heartbeat`). Yanıtlar için hedef ana oturumun son teslim bağlamını kullanabilirler ancak rutin cron turlarını insan sohbet hattına eklemez ve hedef oturumun günlük/boşta sıfırlama güncelliğini uzatmazlar. **Yalıtılmış** işler, yeni bir oturumla ayrılmış bir agent turu çalıştırır. **Özel oturumlar** (`session:xxx`) bağlamı çalıştırmalar arasında kalıcı tutarak önceki özetleri temel alan günlük durum toplantıları gibi iş akışlarını mümkün kılar.

    Ana oturum cron olayları, kendi kendine yeterli sistem olayı hatırlatıcılarıdır. Varsayılan heartbeat isteminin "Read HEARTBEAT.md" talimatını otomatik olarak içermezler; bir hatırlatıcının `HEARTBEAT.md` dosyasına başvurması gerekiyorsa bunu cron olay metninde açıkça belirtin.

  </Accordion>
  <Accordion title="Yalıtılmış işler için 'yeni oturum' ne anlama gelir">
    Her çalıştırma için yeni bir transkript/oturum kimliği. OpenClaw güvenli tercihleri (düşünme/hızlı/ayrıntılı ayarları, etiketler, kullanıcının açıkça seçtiği model/kimlik doğrulama geçersiz kılmaları) taşır ancak eski bir cron satırından ortam konuşma bağlamını devralmaz: kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yetki yükseltme, kaynak ya da ACP çalışma zamanı bağlaması. Yinelenen bir işin bilinçli olarak aynı konuşma bağlamını temel alması gerekiyorsa `current` veya `session:<id>` kullanın.
  </Accordion>
  <Accordion title="Alt agent ve Discord teslimi">
    Yalıtılmış cron çalıştırmaları alt agent'ları düzenlediğinde teslim, eski ana agent ara metni yerine son alt soy çıktısını tercih eder. Alt soylar hâlâ çalışıyorsa OpenClaw bu kısmi ana agent güncellemesini duyurmak yerine bastırır.

    Yalnızca metin içeren Discord duyuru hedefleri için OpenClaw, hem akışla iletilen/ara metni hem de nihai yanıtı yeniden oynatmak yerine kurallı nihai asistan metnini bir kez gönderir. Eklerin ve bileşenlerin atılmaması için medya ve yapılandırılmış Discord yükleri yine ayrı olarak teslim edilir.

  </Accordion>
</AccordionGroup>

## Teslim ve çıktı

| Mod        | Gerçekleşen işlem                                                    |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Agent göndermediyse nihai metni hedefe yedek olarak teslim eder |
| `webhook`  | Tamamlanan olay yükünü bir URL'ye POST eder                      |
| `none`     | Çalıştırıcı tarafından yedek teslim yapılmaz                     |

Kanal teslimi için `--announce --channel telegram --to "-1001234567890"` kullanın. Telegram forum konuları için `-1001234567890:topic:123` kullanın; OpenClaw ayrıca Telegram'a ait `-1001234567890:123` kısa gösterimini de kabul eder. Doğrudan RPC/yapılandırma çağıranlar `delivery.threadId` değerini dize veya sayı olarak iletebilir. Slack/Discord/Mattermost hedefleri açık önekler kullanır (`channel:<id>`, `user:<id>`). Matrix oda kimlikleri büyük/küçük harfe duyarlıdır; tam oda kimliğini veya Matrix'ten alınan `room:!room:server` biçimini kullanın.

Duyuru teslimi `channel: "last"` kullandığında veya `channel` belirtilmediğinde, `telegram:123` gibi sağlayıcı önekli bir hedef, cron oturum geçmişine veya yapılandırılmış tek bir kanala dönmeden önce kanalı seçebilir. Yalnızca yüklenen Plugin tarafından duyurulan önekler sağlayıcı seçicileridir. `delivery.channel` açıkça belirtilmişse hedef öneki aynı sağlayıcıyı adlandırmalıdır; `channel: "whatsapp"` ile `to: "telegram:123"`, WhatsApp'ın Telegram kimliğini telefon numarası olarak yorumlamasına izin vermek yerine reddedilir. Hedef türü ve hizmet önekleri (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) sağlayıcı seçicileri değil, kanalın sahip olduğu hedef söz dizimi olarak kalır.

Yalıtılmış işler için sohbet teslimi ortaktır: bir sohbet rotası varsa agent, `--no-deliver` ile bile `message` aracını kullanabilir. Agent yapılandırılmış/geçerli hedefe gönderirse OpenClaw yedek duyuruyu atlar. Aksi takdirde `announce`, `webhook` ve `none` yalnızca agent turundan sonra çalıştırıcının nihai yanıtla ne yapacağını denetler.

Bir agent etkin bir sohbetten yalıtılmış hatırlatıcı oluşturduğunda OpenClaw, yedek duyuru rotası için korunmuş canlı teslim hedefini saklar. Dahili oturum anahtarları küçük harfli olabilir; geçerli sohbet bağlamı kullanılabiliyorsa sağlayıcı teslim hedefleri bu anahtarlardan yeniden oluşturulmaz.

Örtük duyuru teslimi, eski hedefleri doğrulamak ve yeniden yönlendirmek için yapılandırılmış kanal izin listelerini kullanır. DM eşleştirme deposu onayları yedek otomasyon alıcıları değildir; zamanlanmış bir işin bir DM'ye proaktif olarak gönderim yapması gerekiyorsa `delivery.to` ayarlayın veya kanal `allowFrom` girdisini yapılandırın.

### Başarısızlık bildirimleri

Başarısızlık bildirimleri ayrı bir hedef yolu izler:

- `cron.failureDestination`, hata bildirimleri için genel bir varsayılan ayarlar.
- `job.delivery.failureDestination`, bunu iş bazında geçersiz kılar.
- Hiçbiri ayarlanmamışsa ve iş zaten `announce` aracılığıyla teslimat yapıyorsa hata bildirimleri bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, birincil teslimat modu `webhook` olmadığı sürece yalnızca `sessionTarget="isolated"` işlerinde desteklenir.
- `failureAlert.includeSkipped: true`, bir işi veya genel cron uyarı politikasını tekrarlanan atlanmış çalıştırma uyarılarına dahil eder. Atlanan çalıştırmalar ayrı bir ardışık atlama sayacı tuttuğundan yürütme hatası geri çekilmesini etkilemez.
- `openclaw cron edit`, iş bazında uyarı ayarı sunar: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` ve `--failure-alert-account-id`.

### Çıktı dili

Cron işleri yanıt dilini kanaldan, yerel ayardan veya önceki mesajlardan çıkarmaz. Dil kuralını zamanlanmış mesaja veya şablona ekleyin:

```bash
openclaw cron edit <jobId> \
  --message "Güncellemeleri özetle. Çince yanıt ver; URL'leri, kodu ve ürün adlarını değiştirme."
```

Şablon dosyalarında dil talimatını oluşturulan istemde tutun ve iş çalışmadan önce `{{language}}` gibi yer tutucuların doldurulduğunu doğrulayın. Çıktı birden fazla dili karıştırıyorsa kuralı açıkça belirtin; örneğin: "Anlatım metni için Çince kullan ve teknik terimleri İngilizce tut."

## CLI örnekleri

<Tabs>
  <Tab title="Tek seferlik hatırlatıcı">
    ```bash
    openclaw cron add \
      --name "Takvim kontrolü" \
      --at "20m" \
      --session main \
      --system-event "Sonraki heartbeat: takvimi kontrol et." \
      --wake now
    ```
  </Tab>
  <Tab title="Yinelenen yalıtılmış iş">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Gece boyunca gerçekleşen güncellemeleri özetle." \
      --name "Sabah özeti" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model ve düşünme geçersiz kılması">
    ```bash
    openclaw cron add \
      --name "Derin analiz" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Proje ilerlemesinin haftalık derinlemesine analizi." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook çıktısı">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Bugünkü dağıtımları JSON olarak özetle." \
      --name "Dağıtım özeti" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Komut çıktısı">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Kuyruk derinliği yoklaması" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## İşleri yönetme

```bash
# Tüm işleri listele
openclaw cron list

# Saklanan bir işi JSON olarak al
openclaw cron get <jobId>

# Çözümlenen teslimat rotası dahil bir işi göster
openclaw cron show <jobId>

# Silmeden etkinleştir/devre dışı bırak
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Bir işi düzenle
openclaw cron edit <jobId> --message "Güncellenmiş istem" --model "opus"

# Bir işi şimdi zorla çalıştır
openclaw cron run <jobId>

# Bir işi şimdi zorla çalıştır ve son durumunu bekle
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Yalnızca zamanı geldiyse çalıştır
openclaw cron run <jobId> --due

# Çalıştırma geçmişini görüntüle
openclaw cron runs --id <jobId> --limit 50

# Belirli bir çalıştırmayı görüntüle
openclaw cron runs --id <jobId> --run-id <runId>

# Bir işi sil
openclaw cron remove <jobId>

# Aracı seçimi (çok aracılı kurulumlar)
openclaw cron create "0 6 * * *" "Operasyon kuyruğunu kontrol et" --name "Operasyon taraması" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Bir oturumun arşivlenmesi (Control UI veya operatör-yönetici çağırıcısından `sessions.patch { archived: true }`) bu oturuma bağlı etkin cron işlerinin tümünü devre dışı bırakır: yalıtılmış `cron:<jobId>` oturumu, bir `session:<key>` hedefi veya bir teslimat/uyandırma `sessionKey` hattı. Oturumu geri yüklemek bu işleri yeniden etkinleştirmez; `openclaw cron enable <jobId>` kullanın. Etkin bağlı işi bulunan oturumlar Control UI kenar çubuğunda bir saat rozeti gösterir.

`openclaw cron run <jobId>`, manuel çalıştırmayı kuyruğa ekledikten sonra döner. Kuyruğa alınan çalıştırma bitene kadar engellenmesi gereken kapatma kancaları, bakım betikleri veya diğer otomasyonlar için `--wait` kullanın; döndürülen `runId` değerini yoklar (varsayılan zaman aşımı `10m`, yoklama aralığı `2s`) ve `ok` durumu için `0`, `error`, `skipped` veya bekleme zaman aşımı için sıfırdan farklı bir kodla çıkar.

Aracı `cron` aracı, `cron(action: "list")` üzerinden kısa iş özetleri (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) döndürür; tam bir iş tanımı için `cron(action: "get", jobId: "...")` kullanın. Doğrudan Gateway çağırıcıları `cron.list` öğesine `compact: true` iletebilir; bunun atlanması, teslimat önizlemelerini içeren tam yanıtı korur.

`openclaw cron create`, `openclaw cron add` için bir diğer addır. Yeni işler, konumsal bir zamanlamanın (`"0 9 * * 1"`, `"every 1h"`, `"20m"` veya bir ISO zaman damgası) ardından konumsal bir aracı istemi kullanabilir. Tamamlanan çalıştırma yükünü bir HTTP uç noktasına POST etmek için `cron add|create` veya `cron edit` üzerinde `--webhook <url>` kullanın; webhook teslimatı sohbet teslimatı bayraklarıyla (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`) birleştirilemez. `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` ve `--clear-account` üzerinde bu yönlendirme alanlarını ayrı ayrı kaldırın (her biri eşleşen ayarlama bayrağıyla birlikte kullanıldığında reddedilir) — bu, yalnızca çalıştırıcı geri dönüş teslimatını devre dışı bırakan `--no-deliver` seçeneğinden farklıdır.

<Note>
Model geçersiz kılma notu:

- `openclaw cron add|edit --model ...`, işin seçili modelini değiştirir.
- Modele izin veriliyorsa tam olarak bu sağlayıcı/model, yalıtılmış aracı çalıştırmasına ulaşır.
- Modele izin verilmiyorsa veya model çözümlenemiyorsa cron, açık bir doğrulama hatasıyla çalıştırmayı başarısız kılar.
- API `cron.update` yük yamaları, saklanan iş modeli geçersiz kılmasını temizlemek için `model: null` değerini ayarlayabilir.
- `openclaw cron edit <job-id> --clear-model`, bu geçersiz kılmayı CLI'dan temizler (`model: null` yamasıyla aynı etki) ve `--model` ile birleştirilemez.
- Yapılandırılmış geri dönüş zincirleri uygulanmaya devam eder; çünkü cron `--model`, oturum `/model` geçersiz kılması değil, işin birincil modelidir.
- `openclaw cron add|edit --fallbacks ...`, yük `fallbacks` değerini ayarlayarak bu iş için yapılandırılmış geri dönüşleri değiştirir; `--fallbacks ""`, geri dönüşü devre dışı bırakır ve çalıştırmayı katı hâle getirir. `openclaw cron edit <job-id> --clear-fallbacks`, iş bazındaki geçersiz kılmayı temizler.
- Açıkça belirtilmiş veya yapılandırılmış bir geri dönüş listesi bulunmayan düz bir `--model`, sessiz bir ek yeniden deneme hedefi olarak aracı birincil modeline geçmez.

</Note>

## Webhook'lar

Gateway, harici tetikleyiciler için HTTP webhook uç noktaları sunabilir. Yapılandırmada etkinleştirin:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Kimlik doğrulama

Her istek, kanca belirtecini üst bilgi aracılığıyla içermelidir:

- `Authorization: Bearer <token>` (önerilen)
- `x-openclaw-token: <token>`

Sorgu dizesi belirteçleri reddedilir.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ana oturum için bir sistem olayını kuyruğa ekleyin:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Yeni e-posta alındı","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Olay açıklaması.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` veya `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Yalıtılmış bir aracı turu çalıştırın:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Gelen kutusunu özetle","name":"E-posta","model":"openai/gpt-5.6-sol"}'
    ```

    Alanlar: `message` (zorunlu), `name`, `agentId`, `sessionKey` (`hooks.allowRequestSessionKey=true` gerektirir), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Eşlenmiş kancalar (POST /hooks/<name>)">
    Özel kanca adları, yapılandırmadaki `hooks.mappings` aracılığıyla çözümlenir. Eşlemeler, rastgele yükleri şablonlar veya kod dönüşümleriyle `wake` ya da `agent` eylemlerine dönüştürebilir.
  </Accordion>
</AccordionGroup>

<Warning>
Kanca uç noktalarını geri döngü, tailnet veya güvenilir bir ters proxy arkasında tutun.

- Özel bir kanca belirteci kullanın; Gateway kimlik doğrulama belirteçlerini yeniden kullanmayın.
- `hooks.path` öğesini özel bir alt yolda tutun; `/` reddedilir.
- Bir kancanın hedefleyebileceği etkin aracıyı sınırlamak için `hooks.allowedAgentIds` ayarını yapın; buna `agentId` atlandığında varsayılan aracı da dahildir.
- Çağıran tarafından seçilen oturumlara ihtiyacınız olmadığı sürece `hooks.allowRequestSessionKey=false` ayarını koruyun.
- `hooks.allowRequestSessionKey` seçeneğini etkinleştirirseniz izin verilen oturum anahtarı biçimlerini sınırlamak için `hooks.allowedSessionKeyPrefixes` değerini de ayarlayın.
- Kanca yükleri varsayılan olarak güvenlik sınırlarıyla sarmalanır.

</Warning>

## Gmail PubSub entegrasyonu

Gmail gelen kutusu tetikleyicilerini Google PubSub aracılığıyla OpenClaw'a bağlayın.

<Note>
**Ön koşullar:** `gcloud` CLI, `gog` (gogcli), etkinleştirilmiş OpenClaw kancaları, herkese açık HTTPS uç noktası için Tailscale.
</Note>

### Sihirbazla kurulum (önerilen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Bu işlem `hooks.gmail` yapılandırmasını yazar, Gmail ön ayarını etkinleştirir ve gönderim uç noktası (`--tailscale funnel|serve|off`) için varsayılan olarak Tailscale Funnel'ı kullanır.

<Warning>
Gmail ön ayarının mesaj başına oturumu konuşma bağlamını ayırır; hedef aracının araçlarını veya çalışma alanını kısıtlamaz. `agentId` değerini ayarlayan özel bir eşleme olmadan Gmail kancaları varsayılan aracı olarak çalışır.

Güvenilmeyen gelen kutuları için kancayı özel bir okuyucu aracıya yönlendirin, bu aracıya salt okunur çalışma alanı erişimi verin veya hiç çalışma alanı erişimi vermeyin ve dosya sistemi yazma, kabuk, tarayıcı ve diğer gereksiz araçları reddedin. Ana aracıyı bilgilendirmesi gerekiyorsa yalnızca gerekli aracılar arası aktarımına izin verin. Bkz. [İstem enjeksiyonu](/tr/gateway/security#prompt-injection), [Çok aracılı korumalı alan ve araçlar](/tr/tools/multi-agent-sandbox-tools) ve [`tools.agentToAgent`](/tr/gateway/config-tools#toolsagenttoagent).
</Warning>

### Gateway otomatik başlatma

`hooks.enabled=true` ve `hooks.gmail.account` ayarlandığında Gateway, açılışta `gog gmail watch serve` işlemini başlatır ve izlemeyi otomatik olarak yeniler. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarını yapın.

### Tek seferlik manuel kurulum

<Steps>
  <Step title="GCP projesini seçin">
    `gog` tarafından kullanılan OAuth istemcisinin sahibi olan GCP projesini seçin:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Konu oluşturun ve Gmail push erişimi verin">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="İzlemeyi başlatın">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model geçersiz kılma ayarı

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Güvenilmeyen gelen kutuları için sağlayıcınızda bulunan en yeni nesil, en üst düzey modeli kullanın. Yukarıdaki değer bir örnektir; model, yapılandırılmış kataloğunuzda ve izin listenizde bulunmalıdır.

## Yapılandırma

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

Yukarıdaki `retry` değerleri varsayılanlardır: `30s/60s/5m` geri çekilme süreleriyle en fazla 3 yeniden deneme yapılır ve beş geçici kategorinin tümü yeniden denenir. `webhookToken`, cron webhook POST isteklerinde `Authorization: Bearer <token>` olarak gönderilir.

`maxConcurrentRuns`, hem zamanlanmış cron dağıtımını hem de yalıtılmış ajan turu yürütmesini sınırlar ve varsayılan değeri 8'dir. Yalıtılmış cron ajan turları, kuyruğun ayrılmış `cron-nested` yürütme hattını dahili olarak kullanır; dolayısıyla bu değeri yükseltmek, bağımsız cron LLM çalıştırmalarının yalnızca dış cron sarmalayıcılarını başlatmak yerine paralel olarak ilerlemesini sağlar. Paylaşılan, cron dışı `nested` hattı bu ayarla genişletilmez.

`cron.store`, elle düzenlenecek canlı bir JSON dosyası değil, mantıksal bir depo anahtarı ve doctor geçiş yoludur. İş verileri SQLite'ta bulunur; değişiklikler için CLI veya Gateway API'sini kullanın.

Cron'u devre dışı bırakın: `cron.enabled: false` veya `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Yeniden deneme davranışı">
    **Tek seferlik yeniden deneme**: geçici hatalar (hız sınırı, aşırı yük, ağ, zaman aşımı, sunucu hatası), `retry.backoffMs` (varsayılan 30s, 60s, 5m) kullanılarak en fazla `retry.maxAttempts` kez (varsayılan 3) yeniden denenir. Kalıcı hatalar işi hemen devre dışı bırakır.

    **Yinelenen yeniden deneme**: art arda yürütme hatalarında genişletilmiş bir zamanlamaya göre geri çekilme uygulanır (30s, 60s, 5m, 15m, 60m). Geri çekilme, sonraki başarılı çalıştırmadan sonra sıfırlanır.

  </Accordion>
  <Accordion title="Bakım">
    `cron.sessionRetention` (varsayılan `24h`, `false` devre dışı bırakır), yalıtılmış çalıştırma oturumu girdilerini temizler. Çalıştırma geçmişi, iş başına en yeni 2000 sonlandırılmış satırı saklar; kayıp satırlar 24 saatlik temizleme aralığını korur.
  </Accordion>
  <Accordion title="Eski depo geçişi">
    Yükseltme sırasında eski `~/.openclaw/cron/jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını SQLite'a aktarmak ve bunları `.migrated` son ekiyle yeniden adlandırmak için `openclaw doctor --fix` komutunu çalıştırın. Hatalı biçimlendirilmiş iş satırları çalışma zamanında atlanır ve daha sonra onarılmak veya incelenmek üzere `jobs-quarantine.json` konumuna kopyalanır.
  </Accordion>
</AccordionGroup>

## Sorun giderme

### Komut sıralaması

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron tetiklenmiyor">
    - `cron.enabled` ayarını ve `OPENCLAW_SKIP_CRON` ortam değişkenini kontrol edin.
    - Gateway'in sürekli çalıştığını doğrulayın.
    - `cron` zamanlamaları için saat dilimini (`--tz`) ana makinenin saat dilimiyle karşılaştırarak doğrulayın.
    - Çalıştırma çıktısındaki `reason: not-due`, manuel çalıştırmanın `openclaw cron run <jobId> --due` ile kontrol edildiği ve işin zamanının henüz gelmediği anlamına gelir.

  </Accordion>
  <Accordion title="Cron tetiklendi ancak teslimat yapılmadı">
    - `none` teslimat modu, çalıştırıcı yedek gönderiminin beklenmediği anlamına gelir. Bir sohbet rotası mevcut olduğunda ajan yine de `message` aracıyla doğrudan gönderebilir.
    - Teslimat hedefinin eksik/geçersiz olması (`channel`/`to`), giden teslimatın atlandığı anlamına gelir.
    - Matrix'te, küçük harfe dönüştürülmüş `delivery.to` oda kimliklerine sahip kopyalanmış veya eski işler başarısız olabilir; çünkü Matrix oda kimlikleri büyük/küçük harfe duyarlıdır. İşi, Matrix'teki tam `!room:server` veya `room:!room:server` değerini kullanacak şekilde düzenleyin.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), teslimatın kimlik bilgileri nedeniyle engellendiği anlamına gelir.
    - Yalıtılmış çalıştırma yalnızca sessiz belirteci (`NO_REPLY` / `no_reply`) döndürürse OpenClaw, doğrudan giden teslimatı ve yedek olarak kuyruğa alınan özet yolunu engeller; dolayısıyla sohbete hiçbir şey gönderilmez.
    - Ajanın kullanıcıya kendisinin mesaj göndermesi gerekiyorsa işin kullanılabilir bir rotası olduğunu doğrulayın (önceki bir sohbetle `channel: "last"` veya açık bir kanal/hedef).

  </Accordion>
  <Accordion title="Cron veya Heartbeat, /new tarzı devretmeyi engelliyor gibi görünüyor">
    - Günlük ve boşta kalma sıfırlama güncelliği `updatedAt` temelinde belirlenmez; bkz. [Oturum yönetimi](/tr/concepts/session#session-lifecycle).
    - Cron uyandırmaları, Heartbeat çalıştırmaları, exec bildirimleri ve Gateway kayıt işlemleri yönlendirme/durum için oturum satırını güncelleyebilir, ancak `sessionStartedAt` veya `lastInteractionAt` sürelerini uzatmaz.
    - Bu alanlar mevcut olmadan önce oluşturulmuş eski satırlarda OpenClaw, dosya hâlâ kullanılabiliyorsa transkript JSONL oturum üst bilgisinden `sessionStartedAt` değerini kurtarabilir. `lastInteractionAt` içermeyen eski boşta kalma satırları, kurtarılan bu başlangıç zamanını boşta kalma temel değeri olarak kullanır.

  </Accordion>
  <Accordion title="Saat dilimiyle ilgili dikkat edilmesi gerekenler">
    - `--tz` içermeyen Cron, Gateway ana makinesinin saat dilimini kullanır.
    - Saat dilimi içermeyen `at` zamanlamaları UTC olarak değerlendirilir.
    - Heartbeat `activeHours`, yapılandırılmış saat dilimi çözümlemesini kullanır.

  </Accordion>
</AccordionGroup>

## İlgili içerikler

- [Otomasyon](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Arka Plan Görevleri](/tr/automation/tasks) — cron yürütmeleri için görev defteri
- [Heartbeat](/tr/gateway/heartbeat) — düzenli ana oturum turları
- [Saat dilimi](/tr/concepts/timezone) — saat dilimi yapılandırması
