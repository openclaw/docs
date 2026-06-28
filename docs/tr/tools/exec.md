---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Exec aracı
x-i18n:
    generated_at: "2026-06-28T01:22:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında kabuk komutları çalıştırın. `exec`, değişiklik yapabilen bir kabuk yüzeyidir: komutlar, seçilen ana makinenin veya sandbox dosya sisteminin izin verdiği her yerde dosya oluşturabilir, düzenleyebilir ya da silebilir. `write`, `edit` veya `apply_patch` gibi OpenClaw dosya sistemi araçlarını devre dışı bırakmak, `exec` aracını salt okunur yapmaz.

`process` üzerinden ön plan + arka plan yürütmesini destekler. `process` izinli değilse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları ajan başına kapsamlanır; `process` yalnızca aynı ajana ait oturumları görür.

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
Bu gecikmeden (ms) sonra komutu otomatik olarak arka plana al.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` beklemek yerine komutu hemen arka plana al.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kıl. `timeout: 0` değerini yalnızca komut exec işlem zaman aşımı olmadan çalışmalıysa ayarla.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mevcut olduğunda sözde terminalde çalıştır. Yalnızca TTY gerektiren CLI'ler, kodlama ajanları ve terminal kullanıcı arayüzleri için kullan.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, bir sandbox çalışma zamanı etkinken `sandbox` olarak, aksi halde `gateway` olarak çözülür.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Normal araç çağrıları için yok sayılır. `gateway` / `node` güvenliği
`tools.exec.security` ve ana makine onayları dosyası tarafından kontrol edilir; yükseltilmiş mod
yalnızca operatör açıkça yükseltilmiş erişim verdiğinde `security=full` değerini zorlayabilir.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Temel sorma modu `tools.exec.ask` ve ana makine onaylarından gelir.
Kanal kaynaklı model çağrıları için, etkin ana makine sorma değeri `off` olduğunda çağrı başına `ask` yok sayılır; aksi halde yalnızca daha katı bir moda sertleştirilebilir. Exec araçlarını açık bir `ask` değeriyle oluşturan güvenilir dahili/API çağırıcıları değişmez.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node kimliği/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod isteyin — sandbox dışına, yapılandırılmış ana makine yoluna çıkın. `security=full` yalnızca elevated `full` olarak çözüldüğünde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` değerindedir: oturum için sandbox çalışma zamanı etkinken sandbox, aksi halde gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bu bir ana makine adı seçici değildir; ana makine adına benzeyen değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. `auto` içinden çağrı başına `host=node` izinlidir; çağrı başına `host=gateway` yalnızca etkin bir sandbox çalışma zamanı olmadığında izinlidir.
- `tools.exec.mode` normalleştirilmiş politika ayarıdır. Değerler `deny`, `allowlist`, `ask`, `auto` ve `full` şeklindedir. `auto`, belirleyici allowlist/güvenli ikili eşleşmelerini doğrudan çalıştırır ve kalan her exec onayı durumunu bir insana sormadan önce OpenClaw'ın yerel otomatik inceleyicisinden geçirir. `ask` / `ask=always` yine de her seferinde bir insana sorar.
- Ek yapılandırma olmadan, `host=auto` yine de "kendiliğinden çalışır": sandbox yoksa `gateway` olarak çözülür; canlı sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox dışına yapılandırılmış ana makine yoluna çıkar: varsayılan olarak `gateway`, veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` ise) `node`. Yalnızca geçerli oturum/sağlayıcı için yükseltilmiş erişim etkinleştirildiğinde kullanılabilir.
- `gateway`/`node` onayları ana makine onayları dosyası tarafından kontrol edilir.
- `node`, eşleştirilmiş bir node gerektirir (eşlikçi uygulama veya başsız node ana makinesi).
- Birden fazla node varsa birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, nodelar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- `timeout`; ön plan, arka plan, `yieldMs`, gateway, sandbox ve node `system.run` yürütmesi için geçerlidir. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, bu çağrı için exec işlem zaman aşımını devre dışı bırakır.
- Windows dışı ana makinelerde exec, ayarlandığında `SHELL` kullanır; `SHELL` `fish` ise fish ile uyumsuz betiklerden kaçınmak için `PATH` içinden `bash` (veya `sh`) tercih eder, ardından ikisi de yoksa `SHELL` değerine geri döner.
- Windows ana makinelerinde exec, PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, ardından PATH),
  sonra Windows PowerShell 5.1'e geri döner.
- Windows dışı gateway ana makinelerinde, bash ve zsh exec komutları bir başlangıç anlık görüntüsü kullanır. OpenClaw, kabuk başlangıç dosyalarından source edilebilir
  alias'ları/işlevleri ve küçük bir güvenli ortam kümesini
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` içine yakalar, ardından her exec komutundan önce bu anlık görüntüyü source eder.
  Gizli bilgiye benzeyen değişkenler hariç tutulur; sandbox ve node exec bu anlık görüntüyü kullanmaz. Bu anlık görüntü yolunu devre dışı bırakmak için
  Gateway işlem ortamında `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` ayarlayın.
- Ana makine yürütmesi (`gateway`/`node`), ikili ele geçirmeyi veya enjekte edilmiş kodu önlemek için
  `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec-tool bağlamını algılayabilmesi için oluşturulan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- Kanal kaynaklı çalıştırmalar için OpenClaw, kanal bu kimlikleri sağladığında
  `OPENCLAW_CHANNEL_CONTEXT` içinde dar kapsamlı bir gönderici/sohbet kimliği JSON yükü de sunar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` içinden engellenir; gateway ana makinesindeki bir terminalde çalıştırın veya varsa sohbetten kanala özgü giriş aracını kullanın.
- Önemli: sandbox kullanımı **varsayılan olarak kapalıdır**. Sandbox kapalıysa, örtük `host=auto`
  `gateway` olarak çözülür. Açık `host=sandbox`, gateway ana makinesinde sessizce
  çalışmak yerine yine de kapalı şekilde başarısız olur. Sandbox'ı etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrol denetimleri (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkin `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözülürse, o dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için, işi bir kez başlatın ve etkin olduğunda, komut çıktı ürettiğinde veya başarısız olduğunda otomatik tamamlanma uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; uyku döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklama ile zamanlama taklidi yapmayın.
- Daha sonra veya bir programa göre gerçekleşmesi gereken işler için `exec` uyku/gecikme desenleri yerine Cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bundan daha uzun çalıştığında tek bir "çalışıyor" bildirimi yayar (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): saniye cinsinden varsayılan komut başına exec zaman aşımı. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` exec işlem zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkinken `sandbox`, aksi halde `gateway` olarak çözülür)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmadığında gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız ana makine exec, gateway + node için varsayılandır. Onay/allowlist davranışı istiyorsanız hem `tools.exec.*` değerlerini hem de ana makine onayları dosyasını sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO, `host=auto` değerinden değil, ana makine politikası varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın ya da `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda, ana makine exec yapılandırılmış politikayı doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön kontrol reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri inceleyici veya açık onay gerektirir. `mode=auto` içinde normal exec onay yolu, yerel otomatik inceleyicinin açıkça düşük riskli tek seferlik bir komuta izin vermesini sağlayabilir; doğrudan node ana makinesi `system.run` çağrıları ise komutu insan onayı rotasına veremedikleri için yine de açık onay gerektirir. İnceleyici sorarsa istek bir insana gider. `allow-always`, zararsız yorumlayıcı/betik çağrılarını kalıcı olarak sürdürebilir, ancak satır içi eval biçimleri dayanıklı izin kurallarına dönüşmez.
- `tools.exec.commandHighlighting` (varsayılan: false): true olduğunda, onay istemleri komut metninde ayrıştırıcıdan türetilen komut aralıklarını vurgulayabilir. Exec onay politikasını değiştirmeden komut metni vurgulamayı etkinleştirmek için genel olarak veya ajan başına `true` ayarlayın.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikili dosyalar. Davranış ayrıntıları için bkz. [Güvenli ikili dosyalar](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdileri hiçbir zaman otomatik olarak güvenilir kabul edilmez. Yerleşik varsayılanlar `/bin` ve `/usr/bin` şeklindedir.
- `tools.exec.safeBinProfiles`: güvenli ikili dosya başına isteğe bağlı özel argv politikası (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

### PATH işleme

- `host=gateway`: oturum açma kabuğunuzun `PATH` değerini exec ortamıyla birleştirir. `env.PATH` geçersiz kılmaları
  ana makine yürütmesi için reddedilir. Daemon'ın kendisi yine de asgari bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Kullanıcı kabuk yapılandırmasının (`~/.zshenv` veya `/etc/zshenv` gibi) başlangıç sırasında öncelikli yolları geçersiz kılmasını önlemek için, `tools.exec.pathPrepend` girdileri yürütmeden hemen önce kabuk komutunun içinde nihai `PATH` başına güvenli biçimde eklenir.
- `host=sandbox`: kapsayıcı içinde `sh -lc` (oturum açma kabuğu) çalıştırır, bu yüzden `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profil source edildikten sonra dahili bir ortam değişkeni üzerinden `env.PATH` değerini başa ekler (kabuk interpolasyonu yoktur);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca ilettiğiniz engellenmemiş ortam geçersiz kılmaları node'a gönderilir. `env.PATH` geçersiz kılmaları
  ana makine yürütmesi için reddedilir ve node ana makineleri tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa
  node ana makine hizmeti ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Ajan başına node bağlama (yapılandırmada ajan listesi dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Kontrol kullanıcı arayüzü: Nodes sekmesi aynı ayarlar için küçük bir "Exec node binding" paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için `/exec` komutunu argümansız gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal izin listeleri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. Yetkili harici kanal gönderenleri
bu oturum varsayılanlarını ayarlayabilir. Dahili gateway/webchat istemcilerinin bunları kalıcı hale getirmek için `operator.admin` yetkisine ihtiyacı vardır.
Exec'i kesin olarak devre dışı bırakmak için araç ilkesiyle reddedin (`tools.deny: ["exec"]` veya ajan başına). Açıkça `security=full` ve `ask=off` ayarlamadığınız sürece ana makine onayları
yine geçerlidir.

## Exec onayları (yardımcı uygulama / Node ana makinesi)

Korumalı alandaki ajanlar, `exec` gateway veya Node ana makinesinde çalışmadan önce istek başına onay gerektirebilir.
İlke, izin listesi ve kullanıcı arayüzü akışı için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

Onaylar gerekli olduğunda exec aracı hemen
`status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandıktan sonra (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway yalnızca onaylanan çalıştırmalar için komut ilerleme ve tamamlanma sistem olayları yayar
(`Exec running` / `Exec finished`). Reddedilen veya zaman aşımına uğrayan onaylar son durumdur ve
ajan oturumunu bir reddetme sistem olayıyla uyandırmaz.
Yerel onay kartları/düğmeleri olan kanallarda ajan önce bu
yerel kullanıcı arayüzüne güvenmeli ve yalnızca araç
sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu
açıkça söylediğinde manuel bir `/approve` komutu eklemelidir.

## İzin listesi + güvenli ikili dosyalar

Manuel izin listesi uygulaması, çözümlenen ikili dosya yolu glob'ları ve yalın komut adı
glob'larıyla eşleşir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`,
`/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda kabuk komutlarına yalnızca her pipeline
segmenti izin listesinde veya güvenli ikili dosya olduğunda otomatik izin verilir. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler,
izin listesi modunda her üst düzey segment
izin listesini (güvenli ikili dosyalar dahil) karşılamadığı sürece reddedilir. Yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlatmaz: zincirlenmiş bir komut hâlâ her
üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Manuel yol izin listesi girişleriyle aynı değildir.
Katı açık güven için `autoAllowSkills` devre dışı bırakılmış halde tutun.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili dosya yürütülebilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikili dosyalar için açık argv ilkesi.
- izin listesi: yürütülebilir dosya yolları için açık güven.

`safeBins` öğesini genel bir izin listesi gibi ele almayın ve yorumlayıcı/çalışma zamanı ikili dosyaları eklemeyin (örneğin `python3`, `node`, `ruby`, `bash`). Bunlara ihtiyacınız varsa açık izin listesi girişleri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girişlerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girişlerini iskeleleyebilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyaları açıkça yeniden `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız, satır içi kod değerlendirme biçimlerinin hâlâ gözden geçiren veya açık onay gerektirmesi için `tools.exec.strictInlineEval` etkinleştirin.

Tam ilke ayrıntıları ve örnekler için [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikili dosyalar ile izin listesi karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist) bölümlerine bakın.

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

Yoklama, bekleme döngüleri için değil isteğe bağlı durum içindir. Otomatik tamamlanma uyandırması
etkinse, komut çıktı yaydığında veya başarısız olduğunda oturumu uyandırabilir.

Tuş gönder (tmux tarzı):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gönder (yalnızca CR gönder):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Yapıştır (varsayılan olarak ayraçlı):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` aracının bir alt aracıdır.
OpenAI ve OpenAI Codex modelleri için varsayılan olarak etkindir. Yapılandırmayı yalnızca
devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Notlar:

- Yalnızca OpenAI/OpenAI Codex modelleri için kullanılabilir.
- Araç ilkesi yine geçerlidir; `allow: ["write"]`, `apply_patch` kullanımına örtük olarak izin verir.
- `deny: ["write"]`, `apply_patch` kullanımını reddetmez; `apply_patch` kullanımını açıkça reddedin veya yama yazmaları da engellenmeliyse `deny: ["group:fs"]` kullanın.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` olur; OpenAI modelleri için aracı devre dışı bırakmak üzere `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` olur (çalışma alanıyla sınırlı). Bunu yalnızca `apply_patch` aracının çalışma alanı dizini dışına yazmasını/silmesini bilinçli olarak istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Korumalı Alan](/tr/gateway/sandboxing) — komutları korumalı alan ortamlarında çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
