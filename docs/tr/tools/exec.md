---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Yürütme aracı
x-i18n:
    generated_at: "2026-05-10T19:57:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında shell komutları çalıştırın. `exec`, değişiklik yapabilen bir shell yüzeyidir: komutlar, seçilen host veya sandbox dosya sisteminin izin verdiği her yerde dosya oluşturabilir, düzenleyebilir veya silebilir. `write`, `edit` veya `apply_patch` gibi OpenClaw dosya sistemi araçlarını devre dışı bırakmak, `exec` aracını salt okunur yapmaz.

`process` aracılığıyla ön plan + arka plan yürütmeyi destekler. `process` izinli değilse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları ajan başına kapsamlanır; `process` yalnızca aynı ajandan gelen oturumları görür.

## Parametreler

<ParamField path="command" type="string" required>
Çalıştırılacak shell komutu.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Komut için çalışma dizini.
</ParamField>

<ParamField path="env" type="object">
Devralınan ortamın üzerine birleştirilen anahtar/değer ortam geçersiz kılmaları.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Bu gecikmeden sonra komutu otomatik olarak arka plana alır (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` beklemek yerine komutu hemen arka plana alır.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kılar. `timeout: 0` değerini yalnızca komut exec süreç zaman aşımı olmadan çalışmalıysa ayarlayın.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mümkün olduğunda sözde terminal içinde çalıştırır. Yalnızca TTY gerektiren CLI'ler, kodlama ajanları ve terminal UI'ları için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, bir sandbox çalışma zamanı etkin olduğunda `sandbox` değerine, aksi halde `gateway` değerine çözümlenir.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` yürütmesi için zorlama modu.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` yürütmesi için onay istemi davranışı.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node id/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod ister — sandbox'tan yapılandırılmış host yoluna çıkar. `security=full` yalnızca elevated `full` değerine çözümlendiğinde zorlanır.
</ParamField>

Notlar:

- `host` varsayılanı `auto` değeridir: oturum için sandbox çalışma zamanı etkin olduğunda sandbox, aksi halde Gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bir ana makine adı seçici değildir; ana makine adına benzeyen değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. `auto` üzerinden çağrı başına `host=node` izinlidir; çağrı başına `host=gateway` yalnızca etkin bir sandbox çalışma zamanı olmadığında izinlidir.
- Ek yapılandırma olmadan `host=auto` yine de "sorunsuz çalışır": sandbox yoksa `gateway` değerine çözümlenir; canlı sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox'tan yapılandırılmış host yoluna çıkar: varsayılan olarak `gateway`, ya da `tools.exec.host=node` olduğunda (veya oturum varsayılanı `host=node` ise) `node`. Yalnızca geçerli oturum/sağlayıcı için yükseltilmiş erişim etkinleştirildiğinde kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından denetlenir.
- `node`, eşleştirilmiş bir Node gerektirir (companion app veya headless node host).
- Birden fazla Node kullanılabiliyorsa birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, Node'lar için tek shell yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- `timeout`; ön plan, arka plan, `yieldMs`, Gateway, sandbox ve Node `system.run` yürütmesi için geçerlidir. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, o çağrı için exec süreç zaman aşımını devre dışı bırakır.
- Windows dışı host'larda exec, ayarlandığında `SHELL` kullanır; `SHELL` `fish` ise, fish ile uyumsuz betiklerden kaçınmak için `PATH` içinden `bash` (veya `sh`) tercih eder, ardından ikisi de yoksa `SHELL` değerine geri döner.
- Windows host'larda exec, PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, ardından PATH),
  ardından Windows PowerShell 5.1'e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili ele geçirmeyi veya enjekte edilmiş kodu önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, shell/profile kurallarının exec aracı bağlamını algılayabilmesi için başlatılan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` üzerinden engellenir; bunu Gateway host'unda bir terminalde çalıştırın veya mevcut olduğunda sohbetten kanalın yerel oturum açma aracını kullanın.
- Önemli: sandboxing **varsayılan olarak kapalıdır**. Sandboxing kapalıysa örtük `host=auto`,
  `gateway` değerine çözümlenir. Açık `host=sandbox`, Gateway host'unda sessizce
  çalışmak yerine yine kapalı şekilde başarısız olur. Sandboxing'i etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön uç kontrolleri (yaygın Python/Node shell söz dizimi hataları için) yalnızca etkili `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözümlenirse, o dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkinleştirildiğinde, komut çıktı verdiğinde veya başarısız olduğunda otomatik tamamlama uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; uyku döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklamayla zamanlamayı taklit etmeyin.
- Daha sonra veya bir zamanlamaya göre gerçekleşmesi gereken işler için `exec` uyku/gecikme kalıpları yerine cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bundan uzun çalıştığında tek bir "çalışıyor" bildirimi yayar (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): saniye cinsinden varsayılan komut başına exec zaman aşımı. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` exec süreç zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` değerine çözümlenir)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmamışsa Gateway + Node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, Gateway + Node için varsayılandır. Onay/izin listesi davranışı istiyorsanız hem `tools.exec.*` hem de host `~/.openclaw/exec-approvals.json` ayarlarını sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO, `host=auto` değerinden değil host policy varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya Node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda host exec, yapılandırılmış policy'yi doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön kontrol reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always`, zararsız yorumlayıcı/betik çağrılarını yine kalıcı hale getirebilir, ancak inline-eval biçimleri yine de her seferinde istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizinlerin listesi (yalnızca Gateway + sandbox).
- `tools.exec.safeBins`: açık izin listesi girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikililer. Davranış ayrıntıları için bkz. [Güvenli ikililer](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol kontrolleri için güvenilen ek açık dizinler. `PATH` girdileri hiçbir zaman otomatik olarak güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin` değerleridir.
- `tools.exec.safeBinProfiles`: güvenli ikili başına isteğe bağlı özel argv policy'si (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: oturum açma shell'inizin `PATH` değerini exec ortamına birleştirir. `env.PATH` geçersiz kılmaları host yürütmesi için reddedilir. Daemon'ın kendisi yine de minimal bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: konteyner içinde `sh -lc` (oturum açma shell'i) çalıştırır; bu nedenle `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profile kaynaklandıktan sonra dahili bir env var aracılığıyla `env.PATH` değerini başa ekler (shell interpolasyonu yoktur);
  `tools.exec.pathPrepend` burada da geçerlidir.
- `host=node`: yalnızca ilettiğiniz engellenmemiş env geçersiz kılmaları Node'a gönderilir. `env.PATH` geçersiz kılmaları host yürütmesi için reddedilir ve Node host'ları tarafından yok sayılır. Bir Node üzerinde ek PATH girdilerine ihtiyacınız varsa,
  Node host hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Ajan başına Node bağlama (config içinde ajan listesi indeksini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Kontrol UI: Nodes sekmesi aynı ayarlar için küçük bir "Exec node binding" paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için `/exec` komutunu argümansız gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal izin listeleri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve config yazmaz. exec'i kesin olarak devre dışı bırakmak için tool
policy üzerinden reddedin (`tools.deny: ["exec"]` veya ajan başına). Açıkça `security=full` ve `ask=off` ayarlamadıkça host onayları yine de geçerlidir.

## Exec onayları (companion app / node host)

Sandbox'lı ajanlar, `exec` Gateway veya Node host üzerinde çalışmadan önce istek başına onay gerektirebilir.
Policy, izin listesi ve UI akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onaylar gerektiğinde exec aracı hemen `status: "approval-pending"` ve bir onay id'siyle döner. Onaylandıktan sonra (veya reddedildikten / zaman aşımına uğradıktan sonra),
Gateway sistem olayları yayar (`Exec finished` / `Exec denied`). Komut `tools.exec.approvalRunningNoticeMs` sonrasında hâlâ çalışıyorsa tek bir `Exec running` bildirimi yayılır.
Yerel onay kartları/düğmeleri olan kanallarda ajan önce bu yerel UI'a güvenmeli ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu açıkça söylüyorsa manuel `/approve` komutu eklemelidir.

## İzin listesi + güvenli ikililer

Manuel izin listesi zorlaması, çözümlenmiş ikili yol glob'ları ve çıplak komut adı glob'larıyla eşleşir. Çıplak adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda shell komutları yalnızca her pipeline segmenti izin listesinde veya güvenli ikiliyse otomatik olarak izinli sayılır. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler, her üst düzey segment izin listesini (güvenli ikililer dahil) karşılamadıkça izin listesi modunda reddedilir. Yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlamaz: zincirlenmiş bir komut yine de her üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Manuel yol izin listesi girdileriyle aynı değildir. Katı ve açık güven için `autoAllowSkills` devre dışı bırakılmış halde kalsın.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili yürütülebilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikililer için açık argv policy'si.
- izin listesi: yürütülebilir yollar için açık güven.

`safeBins` değerini genel bir izin listesi olarak ele almayın ve yorumlayıcı/çalışma zamanı ikili dosyaları (örneğin `python3`, `node`, `ruby`, `bash`) eklemeyin. Bunlara ihtiyacınız varsa açık izin listesi girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerini iskelet olarak oluşturabilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyaları açıkça yeniden `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız satır içi kod değerlendirme biçimlerinin yine de yeni bir onay gerektirmesi için `tools.exec.strictInlineEval` ayarını etkinleştirin.

Tam politika ayrıntıları ve örnekler için bkz. [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikili dosyalar ile izin listesi karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Yoklama, bekleme döngüleri için değil, isteğe bağlı durum içindir. Otomatik tamamlama uyandırması
etkinse komut çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

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

Yapıştır (varsayılan olarak köşeli parantezli):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` alt aracıdır.
OpenAI ve OpenAI Codex modellerinde varsayılan olarak etkindir. Yapılandırmayı yalnızca
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
- Araç politikası hâlâ geçerlidir; `allow: ["write"]` örtük olarak `apply_patch` kullanımına izin verir.
- `deny: ["write"]`, `apply_patch` kullanımını reddetmez; `apply_patch` kullanımını açıkça reddedin veya yama yazmalarının da engellenmesi gerektiğinde `deny: ["group:fs"]` kullanın.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; OpenAI modelleri için aracı devre dışı bırakmak üzere `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanıyla sınırlı). Yalnızca `apply_patch` aracının çalışma alanı dizini dışına yazmasını/silmesini özellikle istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay geçitleri
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox uygulanmış ortamlarda çalıştırma
- [Arka Plan İşlemi](/tr/gateway/background-process) — uzun süre çalışan exec ve işlem aracı
- [Güvenlik](/tr/gateway/security) — araç politikası ve yükseltilmiş erişim
