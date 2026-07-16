---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Exec aracı
x-i18n:
    generated_at: "2026-07-16T17:59:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında kabuk komutlarını çalıştırır. `exec`, değişiklik yapan bir kabuk yüzeyidir: komutlar, seçilen ana makine veya korumalı alan dosya sisteminin izin verdiği her yerde dosya oluşturabilir, düzenleyebilir veya silebilir. `write`, `edit` veya `apply_patch` gibi OpenClaw dosya sistemi araçlarını devre dışı bırakmak, `exec` aracını salt okunur hâle getirmez.

`process` aracılığıyla ön planda ve arka planda yürütmeyi destekler. `process` kullanımına izin verilmiyorsa `exec` eşzamanlı olarak çalışır ve `yieldMs`/`background` değerlerini yok sayar. Arka plan oturumları her agent için ayrı kapsamlanır; `process` yalnızca aynı agent'ın oturumlarını görür.

## Parametreler

<ParamField path="command" type="string" required>
Çalıştırılacak kabuk komutu.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Komutun çalışma dizini.
</ParamField>

<ParamField path="env" type="object">
Devralınan ortamın üzerine birleştirilen anahtar/değer ortam geçersiz kılmaları.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Bu gecikmeden (ms) sonra komutu otomatik olarak arka plana alır.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` için beklemek yerine komutu hemen arka planda çalıştırır.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını saniye cinsinden geçersiz kılar. Ön plan, arka plan, `yieldMs`, gateway, korumalı alan ve node `system.run` yürütmeleri için geçerlidir. `timeout: 0`, söz konusu çağrı için exec işlemi zaman aşımını devre dışı bırakır.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Kullanılabilir olduğunda sözde terminalde çalıştırır. Yalnızca TTY ile çalışan CLI'lar, kodlama agent'ları ve terminal kullanıcı arayüzleri için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, bir korumalı alan çalışma zamanı etkin olduğunda `sandbox` olarak, aksi takdirde `gateway` olarak çözümlenir.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Normal araç çağrılarında yok sayılır. `gateway`/`node` güvenliği, `tools.exec.security` ve ana makine onayları dosyası tarafından denetlenir; yükseltilmiş mod, yalnızca operatör yükseltilmiş erişimi açıkça verdiğinde `security=full` değerini zorunlu kılabilir.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Temel sorma modu `tools.exec.ask` ve ana makine onaylarından gelir. Kanal kaynaklı model çağrılarında, etkin ana makine sorma modu `off` olduğunda çağrı başına `ask` yok sayılır; aksi takdirde yalnızca daha katı bir moda yükseltilebilir. Açık bir `ask` değeriyle exec araçları oluşturan güvenilir dahili/API çağıranları değişmeden kalır.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node kimliği/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod ister: korumalı alandan çıkarak yapılandırılmış ana makine yoluna geçer. `security=full` yalnızca elevated değeri `full` olarak çözümlendiğinde zorunlu kılınır.
</ParamField>

Notlar:

- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bu bir ana makine adı seçicisi değildir; ana makine adına benzeyen değerler komut çalıştırılmadan önce reddedilir.
- Çağrı başına `host=node` kullanımına `auto` üzerinden izin verilir; çağrı başına `host=gateway` kullanımına yalnızca etkin bir korumalı alan çalışma zamanı olmadığında izin verilir.
- Ek yapılandırma olmadan da `host=auto` "doğrudan çalışır": korumalı alan yoksa `gateway` olarak çözümlenir; etkin bir korumalı alan varsa korumalı alanda kalır.
- `elevated`, korumalı alandan çıkarak yapılandırılmış ana makine yoluna geçer: varsayılan olarak `gateway`; `tools.exec.host=node` (veya oturum varsayılanı `host=node`) olduğunda ise `node`. Yalnızca mevcut oturum/sağlayıcı için yükseltilmiş erişim etkinleştirildiğinde kullanılabilir.
- `gateway`/`node` onayları, ana makine onayları dosyası tarafından denetlenir.
- `node`, eşleştirilmiş bir node (yardımcı uygulama veya başsız node ana makinesi) gerektirir. Birden fazla node varsa birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, node'lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- Windows dışındaki ana makinelerde exec, ayarlanmışsa `SHELL` kullanır; `SHELL` değeri `fish` ise fish ile uyumsuz bash kullanımlarından kaçınmak için `PATH` içindeki `bash` (veya `sh`) tercih edilir, ikisi de yoksa `SHELL` seçeneğine geri döner.
- Windows ana makinelerinde exec, PowerShell 7 (`pwsh`) keşfini (Program Files, ProgramW6432, ardından PATH) tercih eder; ardından Windows PowerShell 5.1'e geri döner.
- Windows dışındaki gateway ana makinelerinde bash ve zsh exec komutları bir başlangıç anlık görüntüsü kullanır. OpenClaw, kaynak olarak yüklenebilen takma adları/işlevleri ve kabuk başlangıç dosyalarındaki küçük ve güvenli bir ortam kümesini `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` içine kaydeder, ardından her exec komutundan önce bu anlık görüntüyü kaynak olarak yükler. Gizli bilgi izlenimi veren değişkenler hariç tutulur; korumalı alan ve node exec bu anlık görüntüyü kullanmaz. Bu anlık görüntü yolunu devre dışı bırakmak için Gateway işlem ortamında `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` ayarlayın.
- Ana makine yürütmesi (`gateway`/`node`), ikili dosya ele geçirmesini veya kod enjekte edilmesini önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec aracı bağlamını algılayabilmesi için başlatılan komut ortamında (PTY ve korumalı alan yürütmesi dâhil) `OPENCLAW_SHELL=exec` ayarlar.
- Kanal kaynaklı çalıştırmalarda OpenClaw, kanal bu kimlikleri sağladığında `OPENCLAW_CHANNEL_CONTEXT` içinde dar kapsamlı bir gönderen/sohbet kimliği JSON yükü de sunar.
- `exec`, `openclaw channels login` veya `/approve` kabuk komutlarını çalıştıramaz: `openclaw channels login` etkileşimli bir kanal kimlik doğrulama akışıdır ve `/approve` bir kabuk üzerinden değil, onay komutu işleyicisinden geçmelidir. Kanal oturum açma işlemini gateway ana makinesindeki bir terminalde çalıştırın veya mevcutsa kanala özgü bir oturum açma agent aracı kullanın (örneğin `whatsapp_login`).
- Önemli: korumalı alan kullanımı **varsayılan olarak kapalıdır**. Korumalı alan kullanımı kapalıysa örtük `host=auto`, `gateway` olarak çözümlenir. Açıkça belirtilen `host=sandbox`, gateway ana makinesinde sessizce çalışmak yerine yine güvenli biçimde başarısız olur. Korumalı alan kullanımını etkinleştirin veya onaylarla birlikte `host=gateway` kullanın.
- Betik ön kontrolleri (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkin `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışında çözümlenirse o dosyanın ön kontrolü atlanır. `host=gateway` olduğunda ve etkin ilke `ask=off` ile birlikte `security=full` olduğunda ön kontrol bütünüyle atlanır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve özellik etkinse, komut çıktı verdiğinde veya başarısız olduğunda otomatik tamamlanma uyandırmasına güvenin. Günlükler, durum, girdi veya müdahale için `process` kullanın; zamanlamayı uyku döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklamalarla taklit etmeyin.
- Daha sonra veya bir zamanlamaya göre gerçekleşmesi gereken işler için `exec` uyku/gecikme kalıpları yerine cron kullanın.

## Yapılandırma

| Anahtar                              | Varsayılan                                             | Notlar                                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Komut başına varsayılan yürütme zaman aşımı (saniye). Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` yürütme işlemi zaman aşımını devre dışı bırakır. |
| `tools.exec.host`                    | `auto`                                                 | Bir korumalı alan çalışma zamanı etkinken `sandbox`, aksi durumda `gateway` olarak çözümlenir.                                         |
| `tools.exec.security`                | korumalı alan için `deny`, ayarlanmadığında gateway/node için `full` |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | ayarlanmamış                                           | Normalleştirilmiş ilke ayarı. Aşağıdaki [Modlar](#modes) bölümüne bakın. `tools.exec.security`/`tools.exec.ask` ile birlikte kullanılamaz.                 |
| `tools.exec.reviewer.model`          | yapılandırılmış birincil ajan                           | `mode=auto` incelemesi için isteğe bağlı sağlayıcı/model geçersiz kılması.                                                                        |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | İnsan geri dönüşünden önce inceleme modeli hazırlığı ve tamamlanması için aşama başına zaman aşımı.                                                       |
| `tools.exec.node`                    | ayarlanmamış                                           |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Doğru olduğunda, arka plana alınmış yürütme oturumları çıkışta bir sistem olayını kuyruğa alır ve Heartbeat ister.                                       |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Onay kapılı bir yürütme bundan daha uzun sürdüğünde tek bir "çalışıyor" bildirimi gönderir (`0` devre dışı bırakır).                       |
| `tools.exec.strictInlineEval`        | `false`                                                | [Satır içi değerlendirme](#inline-eval-strictinlineeval) bölümüne bakın.                                                                                  |
| `tools.exec.commandHighlighting`     | `false`                                                | Doğru olduğunda, onay istemleri komut metninde ayrıştırıcıdan türetilen komut bölümlerini vurgulayabilir. Genel olarak veya ajan başına ayarlanır; onay ilkesini değiştirmez. |
| `tools.exec.pathPrepend`             | ayarlanmamış                                           | Yürütme çalıştırmaları için `PATH` öğesinin başına eklenecek dizinlerin listesi (yalnızca gateway + korumalı alan).                           |
| `tools.exec.safeBins`                | ayarlanmamış                                           | Açık izin listesi girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikili dosyalar. [Güvenli ikili dosyalar](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) bölümüne bakın. |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdilerine hiçbir zaman otomatik olarak güvenilmez.               |
| `tools.exec.safeBinProfiles`         | ayarlanmamış                                           | Güvenli ikili dosya başına isteğe bağlı özel argv ilkesi (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).               |

Onaysız ana makine yürütmesi, gateway ve node için varsayılandır (`security=full`, `ask=off`) — bu, `host=auto` öğesinden değil, ana makine ilkesi varsayılanlarından gelir. Onay/izin listesi davranışı istiyorsanız hem `tools.exec.*` öğesini hem de ana makine onayları dosyasını sıkılaştırın; [Yürütme onayları](/tr/tools/exec-approvals#yolo-mode-no-approval) bölümüne bakın. Korumalı alan durumundan bağımsız olarak gateway veya node yönlendirmesini zorlamak için `tools.exec.host` ayarlayın ya da `/exec host=...` kullanın.

Örnek:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Modlar

`tools.exec.mode`, normalleştirilmiş ilke ayarıdır. Ayarlandığında `security`/`ask` türetilir ve açık `tools.exec.security`/`tools.exec.ask` ile birlikte kullanılamaz.

| Mod         | güvenlik    | sor        | Davranış                                                                                                                        |
| ----------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | `deny`      | `off`     | Yürütme reddedilir.                                                                                                             |
| `allowlist` | `allowlist` | `off`     | Yalnızca izin listesindeki/güvenli ikili dosya komutları çalışır; başka hiçbir şey sorulmaz.                                    |
| `ask`       | `allowlist` | `on-miss` | İzin listesiyle eşleşenler doğrudan çalışır; diğer her şey bir insana sorulur.                                                   |
| `auto`      | `allowlist` | `on-miss` | İzin listesiyle/güvenli ikili dosyayla eşleşenler doğrudan çalışır; diğer her şey bir insana sorulmadan önce OpenClaw'ın yerel otomatik inceleyicisine yönlendirilir. |
| `full`      | `full`      | `off`     | Onay kapısı yoktur.                                                                                                             |

`ask`/`ask=always`, moddan bağımsız olarak her seferinde yine bir insana sorar.

Otomatik inceleme onayı tek kullanımlıktır. Gateway üzerinde OpenClaw, çözümlenmiş yürütülebilir dosya yolunu inceleyiciye sağlar ve yürütmeyi aynı yola sabitler. Heredoc'lar, kabuk genişletmeleri veya desteklenmeyen sarmalayıcı tırnaklamaları gibi uygulanabilir tek bir yürütme planına indirgenemeyen komutlar, model aksi durumda izin verecek olsa bile insan onayına geri döner.

Açık çalışma zamanı veya yerel ilke tarafından henüz karara bağlanmamış Codex app-server komut onayları, insan onayı yolunu kullanır. Codex, inceleme kararını Codex'in çalıştırdığı komuta bağlayabilecek uygulanabilir ve çözümlenmiş bir yürütülebilir dosya sunmadığından OpenClaw, yapılandırılmış yürütme inceleyicisini bu istekler için çalıştırmaz.

### Satır içi değerlendirme (`strictInlineEval`)

`tools.exec.strictInlineEval`, `true` olduğunda satır içi yorumlayıcı değerlendirme biçimleri inceleyici veya açık onay gerektirir: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` ve desteklenen diğer yorumlayıcılar ile komut taşıyıcılarındaki benzer biçimler (`awk`, `find -exec`, `make`, `sed`, `xargs` ve diğerleri). `mode=auto` modunda normal yürütme onayı yolu, yerel otomatik inceleyicinin açıkça düşük riskli tek seferlik bir komuta izin vermesini sağlayabilir; doğrudan node ana makinesindeki `system.run` çağrıları ise komutu bir insan onayı yoluna aktaramadıkları için yine açık onay gerektirir. İnceleyici sorarsa istek bir insana gider. `allow-always` zararsız yorumlayıcı/betik çağrılarını kalıcı hâle getirmeye devam edebilir, ancak satır içi değerlendirme biçimleri kalıcı izin kurallarına dönüşmez.

### PATH işleme

- `host=gateway`: oturum açma kabuğunuzun `PATH` değerini yürütme ortamıyla birleştirir. Ana makine yürütmesi için `env.PATH` geçersiz kılmaları reddedilir. Artalan sürecinin kendisi yine asgari bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Kullanıcı kabuk yapılandırmasının (`~/.zshenv` veya `/etc/zshenv` gibi) başlangıç sırasında öncelikli yolları geçersiz kılmasını önlemek için `tools.exec.pathPrepend` girdileri, yürütmeden hemen önce kabuk komutu içindeki son `PATH` değerinin başına güvenli biçimde eklenir.
- `host=sandbox`: kapsayıcı içinde `sh -lc` (oturum açma kabuğu) çalıştırır; bu nedenle `/etc/profile`, `PATH` değerini sıfırlayabilir. OpenClaw, profil kaynaklandıktan sonra dahili bir ortam değişkeni aracılığıyla `env.PATH` değerini başa ekler (kabuk enterpolasyonu yoktur); `tools.exec.pathPrepend` burada da geçerlidir.
- `host=node`: yalnızca ilettiğiniz ve engellenmemiş ortam geçersiz kılmaları node'a gönderilir. Ana makine yürütmesi için `env.PATH` geçersiz kılmaları reddedilir ve node ana makineleri tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa node ana makine hizmeti ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Ajan başına node bağlama (yapılandırmada ajan listesi dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: **Cihazlar** sayfası, aynı ayarlar için küçük bir "Yürütme node'u bağlama" paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın. Geçerli değerleri göstermek için bağımsız değişken olmadan `/exec` gönderin.

Örnek:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal izin listeleri/eşleştirme ile `commands.useAccessGroups`). Yalnızca **oturum durumunu** günceller ve yapılandırmaya yazmaz. Yetkili harici kanal gönderenleri bu oturum varsayılanlarını ayarlayabilir. Dahili gateway/webchat istemcilerinin bunları kalıcı hâle getirmesi için `operator.admin` gerekir.

Yürütmeyi kesin olarak devre dışı bırakmak için araç ilkesi aracılığıyla reddedin (`tools.deny: ["exec"]` veya ajan başına). `security=full` ve `ask=off` açıkça ayarlanmadığı sürece ana makine onayları uygulanmaya devam eder.

## Yürütme onayları (eşlikçi uygulama / node ana makinesi)

Korumalı alandaki ajanlar, `exec` gateway veya node ana makinesinde çalışmadan önce istek başına onay gerektirebilir. İlke, izin listesi ve UI akışı için [Yürütme onayları](/tr/tools/exec-approvals) bölümüne bakın.

İnsan onayı gerektiğinde node ana makinesi ve yerel olmayan gateway akışları, `status: "approval-pending"` ve bir onay kimliğiyle hemen döner. Yerel sohbet ve Web UI gateway akışları bunun yerine satır içinde bekleyebilir ve onaydan sonra nihai komut sonucunu döndürebilir. Bir `approval-pending` sonucu, komutun başlamadığı anlamına gelir; bu nedenle ön plan geri dönüş uyarıları yalnızca onaylanan komut gerçekten satır içinde çalışırsa görünür. Onaylanan eşzamansız çalıştırmalar, komut ilerleme ve tamamlanma sistem olayları gönderir (`Exec running` / `Exec finished`); reddedilen veya zaman aşımına uğrayan onaylar sonlandırıcıdır ve ajan oturumunu bir ret sistem olayıyla uyandırmaz.

Yerel onay kartları/düğmeleri bulunan kanallarda agent önce bu yerel kullanıcı arayüzüne güvenmeli ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu açıkça belirttiğinde manuel bir `/approve` komutu eklemelidir.

## İzin listesi + güvenli ikili dosyalar

Manuel izin listesi uygulaması, çözümlenmiş ikili dosya yolu glob kalıplarıyla ve yalnızca komut adından oluşan glob kalıplarıyla eşleşir. Yalnızca ad içeren kalıplar sadece PATH üzerinden çağrılan komutlarla eşleşir; dolayısıyla komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir ancak `./rg` veya `/tmp/rg` ile eşleşmez.

`security=allowlist` olduğunda kabuk komutlarına yalnızca her işlem hattı segmenti izin listesinde veya güvenli bir ikili dosya olduğunda otomatik olarak izin verilir. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler, her üst düzey segment (güvenli ikili dosyalar dâhil) izin listesini karşılamadığı sürece izin listesi modunda reddedilir. Yönlendirmeler desteklenmemeye devam eder. Kalıcı `allow-always` güveni bu kuralı geçersiz kılmaz: zincirlenmiş bir komut yine de her üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur; manuel yol izin listesi girdileriyle aynı değildir. Katı ve açık güven için `autoAllowSkills` devre dışı bırakılmalıdır.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili dosya yürütülebilir yolları için açıkça güvenilen ek dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikili dosyalar için açık argv ilkesi.
- allowlist: yürütülebilir dosya yolları için açık güven.

`safeBins` genel amaçlı bir izin listesi olarak değerlendirilmemeli ve yorumlayıcı/çalışma zamanı ikili dosyaları (örneğin `python3`, `node`, `ruby`, `bash`) eklenmemelidir. Bunlara ihtiyaç duyulursa açık izin listesi girdileri kullanılmalı ve onay istemleri etkin tutulmalıdır.

`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profiller eksik olduğunda uyarır; `openclaw doctor --fix` ise eksik özel `safeBinProfiles` girdilerinin iskeletini oluşturabilir. `openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyalar açıkça yeniden `safeBins` içine eklendiğinde de uyarır (`jq` ortam verilerini okuyabilir ve modüllerden veya başlangıç dosyalarından jq kodu yükleyebilir; bu nedenle bunun yerine açık izin listesi girdilerini veya onay kapılı çalıştırmaları tercih edin). `jq`, açıkça listelense bile güvenli ikili dosya olarak reddedilir. Yorumlayıcıları açıkça izin listesine eklerseniz satır içi kod değerlendirme biçimlerinin yine de inceleyici veya açık onay gerektirmesi için `tools.exec.strictInlineEval` seçeneğini etkinleştirin.

İlkenin tüm ayrıntıları ve örnekler için [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikili dosyalar ile izin listesinin karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist) bölümlerine bakın.

## Örnekler

Ön plan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Arka plan + yoklama:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Yoklama, bekleme döngüleri için değil, isteğe bağlı durum denetimi içindir. Otomatik tamamlanma uyandırması etkinse komut, çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

Tuş gönderme (tmux tarzı):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gönderme (yalnızca CR gönderir):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Yapıştırma (varsayılan olarak köşeli ayraçlı):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` aracının bir alt aracıdır. Varsayılan olarak etkindir ve tüm model sağlayıcıları tarafından kullanılabilir; `allowModels` bunu kısıtlayabilir. Yapılandırmayı yalnızca aracı devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Notlar:

- Araç ilkesi uygulanmaya devam eder; `allow: ["write"]`, `apply_patch` için örtük olarak izin verir.
- `deny: ["write"]`, `apply_patch` aracını reddetmez; `apply_patch` aracını açıkça reddedin veya yama yazma işlemlerinin de engellenmesi gerektiğinde `deny: ["group:fs"]` kullanın.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; aracı devre dışı bırakmak için bunu `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanıyla sınırlıdır). `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini kasıtlı olarak istiyorsanız bunu yalnızca `false` olarak ayarlayın.
- `tools.exec.applyPatch.allowModels`, isteğe bağlı bir model kimliği izin listesidir (örneğin `gpt-5.4` gibi ham veya `openai/gpt-5.4` gibi tam). Ayarlandığında aracı yalnızca eşleşen modeller alır; ayarlanmadığında tüm modeller alır.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) — komutları korumalı ortamlarda çalıştırma
- [Arka Plan İşlemi](/tr/gateway/background-process) — uzun süre çalışan exec ve işlem aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
