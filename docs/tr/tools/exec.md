---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Exec aracı
x-i18n:
    generated_at: "2026-05-06T09:33:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında kabuk komutları çalıştırın. `process` aracılığıyla ön plan + arka plan yürütmesini destekler.
`process` izinli değilse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları ajan başına kapsamlandırılır; `process` yalnızca aynı ajandan gelen oturumları görür.

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
Bu gecikmeden sonra komutu otomatik olarak arka plana alın (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` beklemek yerine komutu hemen arka plana alın.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kılın. `timeout: 0` değerini yalnızca komut exec süreci zaman aşımı olmadan çalışması gerektiğinde ayarlayın.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mevcut olduğunda sözde terminalde çalıştırın. Yalnızca TTY ile çalışan CLI'lar, kodlama ajanları ve terminal UI'ları için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, bir sandbox çalışma zamanı etkin olduğunda `sandbox` değerine, aksi halde `gateway` değerine çözümlenir.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` yürütmesi için uygulama modu.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` yürütmesi için onay istemi davranışı.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node kimliği/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod isteyin — sandbox'tan yapılandırılmış host yoluna çıkın. `security=full` yalnızca yükseltme `full` değerine çözümlendiğinde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` değerini kullanır: oturum için sandbox çalışma zamanı etkin olduğunda sandbox, aksi halde gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` değerlerini kabul eder. Bu bir hostname seçici değildir; hostname benzeri değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. `auto` üzerinden çağrı başına `host=node` kullanılabilir; çağrı başına `host=gateway` yalnızca etkin bir sandbox çalışma zamanı yokken kullanılabilir.
- Ek yapılandırma olmadan, `host=auto` yine de "öylece çalışır": sandbox yoksa `gateway` değerine çözümlenir; canlı sandbox varsa sandbox'ta kalır.
- `elevated`, sandbox'tan yapılandırılmış host yoluna çıkar: varsayılan olarak `gateway` veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` olduğunda) `node`. Yalnızca geçerli oturum/provider için yükseltilmiş erişim etkinleştirildiğinde kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından kontrol edilir.
- `node`, eşleştirilmiş bir node gerektirir (yardımcı uygulama veya başsız node host).
- Birden fazla node mevcutsa, birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, node'lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- `timeout`; ön plan, arka plan, `yieldMs`, gateway, sandbox ve node `system.run` yürütmesine uygulanır. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, bu çağrı için exec süreci zaman aşımını devre dışı bırakır.
- Windows olmayan host'larda, exec ayarlandığında `SHELL` kullanır; `SHELL` `fish` ise fish ile uyumsuz betiklerden kaçınmak için `PATH` üzerinden `bash` (veya `sh`)
  tercih eder, ardından ikisi de yoksa `SHELL` değerine geri döner.
- Windows host'larda, exec PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, sonra PATH),
  ardından Windows PowerShell 5.1'e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili dosya ele geçirmeyi veya enjekte edilmiş kodu
  önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec aracı bağlamını algılayabilmesi için oluşturulan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` içinden engellenir; bunu gateway host üzerindeki bir terminalde çalıştırın veya mevcut olduğunda sohbetten kanala özgü giriş aracını kullanın.
- Önemli: sandbox kullanımı **varsayılan olarak kapalıdır**. Sandbox kapalıysa, örtük `host=auto`
  `gateway` değerine çözümlenir. Açık `host=sandbox`, gateway host üzerinde sessizce
  çalışmak yerine yine kapalı şekilde başarısız olur. Sandbox kullanımını etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrol denetimleri (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkin
  `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözümlenirse, o
  dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkinleştirildiğinde komut çıktı verdiğinde veya başarısız olduğunda otomatik
  tamamlanma uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; sleep döngüleri, timeout döngüleri veya tekrarlanan yoklamalarla
  zamanlama taklit etmeyin.
- Daha sonra veya bir zamanlamaya göre gerçekleşmesi gereken işler için `exec` sleep/gecikme kalıpları yerine cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bundan daha uzun çalıştığında tek bir "çalışıyor" bildirimi yayınlar (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): saniye cinsinden varsayılan komut başına exec zaman aşımı. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` exec süreci zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` değerine çözümlenir)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmadığında gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + node için varsayılandır. Onay/allowlist davranışı istiyorsanız hem `tools.exec.*` hem de host `~/.openclaw/exec-approvals.json` değerlerini sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO, `host=auto` değerinden değil host ilkesi varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda, host exec yapılandırılmış ilkeyi doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön kontrol reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always` zararsız yorumlayıcı/betik çağrılarını yine kalıcı hale getirebilir, ancak satır içi eval biçimleri her seferinde istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizinler listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikili dosyalar. Davranış ayrıntıları için bkz. [Güvenli bin'ler](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdileri asla otomatik olarak güvenilir kabul edilmez. Yerleşik varsayılanlar `/bin` ve `/usr/bin` değerleridir.
- `tools.exec.safeBinProfiles`: güvenli bin başına isteğe bağlı özel argv ilkesi (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: login-shell `PATH` değerinizi exec ortamıyla birleştirir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir. Daemon'ın kendisi yine de en düşük düzeyde bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: container içinde `sh -lc` (login shell) çalıştırır, bu nedenle `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profil kaynaklandıktan sonra `env.PATH` değerini dahili bir env var aracılığıyla başa ekler (kabuk interpolasyonu yoktur);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca ilettiğiniz engellenmemiş env geçersiz kılmaları node'a gönderilir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir ve node host'ları tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa,
  node host hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Ajan başına node bağlama (yapılandırmada ajan listesi dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes sekmesi, aynı ayarlar için küçük bir "Exec node binding" paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için argümansız `/exec` gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal allowlist'leri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. exec'i kalıcı olarak devre dışı bırakmak için araç
ilkesi üzerinden reddedin (`tools.deny: ["exec"]` veya ajan başına). Açıkça `security=full` ve `ask=off` ayarlamadığınız sürece host onayları yine uygulanır.

## Exec onayları (yardımcı uygulama / node host)

Sandbox içindeki ajanlar, `exec` gateway veya node host üzerinde çalışmadan önce istek başına onay gerektirebilir.
İlke, allowlist ve UI akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onaylar gerektiğinde, exec aracı hemen
`status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandıktan sonra (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway sistem olayları yayınlar (`Exec finished` / `Exec denied`). Komut `tools.exec.approvalRunningNoticeMs` sonrasında hâlâ
çalışıyorsa tek bir `Exec running` bildirimi yayınlanır.
Yerel onay kartları/düğmeleri olan kanallarda, ajan önce bu yerel UI'a güvenmeli ve yalnızca araç
sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu açıkça söylediğinde manuel bir `/approve` komutu eklemelidir.

## Allowlist + güvenli bin'ler

Manuel allowlist uygulaması, çözümlenmiş ikili dosya yolu glob'ları ve yalın komut adı
glob'larıyla eşleşir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir, bu nedenle komut `rg` olduğunda `rg`
`/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda, kabuk komutları yalnızca her pipeline
segmenti allowlist'te yer alıyorsa veya güvenli bin ise otomatik olarak izinli kabul edilir. Zincirleme (`;`, `&&`, `||`) ve yeniden yönlendirmeler,
her üst düzey segment allowlist'i (güvenli bin'ler dahil) sağlamadığı sürece allowlist modunda reddedilir.
Yeniden yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlatmaz: zincirlenmiş bir komut yine her
üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Manuel yol allowlist girdileriyle aynı değildir.
Katı açık güven için `autoAllowSkills` devre dışı bırakılmış kalsın.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli bin yürütülebilir yolları için açık ek güvenilen dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli bin'ler için açık argv ilkesi.
- allowlist: yürütülebilir yollar için açık güven.

`safeBins` öğesini genel bir izin listesi gibi ele almayın ve yorumlayıcı/çalışma zamanı ikili dosyaları (örneğin `python3`, `node`, `ruby`, `bash`) eklemeyin. Bunlara ihtiyacınız varsa, açık izin listesi girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerini iskelet olarak oluşturabilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyaları açıkça tekrar `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız, satır içi kod değerlendirme biçimlerinin yine de yeni bir onay gerektirmesi için `tools.exec.strictInlineEval` öğesini etkinleştirin.

Tam ilke ayrıntıları ve örnekler için bkz. [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikili dosyalar ve izin listesi](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Yoklama, bekleme döngüleri için değil, isteğe bağlı durum içindir. Otomatik tamamlanma uyandırması
etkinse, komut çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

Tuş gönderme (tmux tarzı):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gönder (yalnızca CR gönder):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Yapıştır (varsayılan olarak bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` öğesinin bir alt aracıdır.
OpenAI ve OpenAI Codex modelleri için varsayılan olarak etkindir. Yapılandırmayı yalnızca
bunu devre dışı bırakmak veya belirli modellerle sınırlandırmak istediğinizde kullanın:

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
- Araç ilkesi yine de geçerlidir; `allow: ["write"]` örtük olarak `apply_patch` öğesine izin verir.
- `deny: ["write"]`, `apply_patch` öğesini reddetmez; `apply_patch` öğesini açıkça reddedin veya yama yazmalarının da engellenmesi gerekiyorsa `deny: ["group:fs"]` kullanın.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` olur; OpenAI modelleri için aracı devre dışı bırakmak üzere bunu `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` olur (çalışma alanı içinde). Bunu yalnızca `apply_patch` öğesinin çalışma alanı dizini dışına yazmasını/silmesini kasıtlı olarak istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları korumalı ortamlarda çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
