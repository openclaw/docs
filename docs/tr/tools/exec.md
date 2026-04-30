---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Yürütme aracı
x-i18n:
    generated_at: "2026-04-30T09:48:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında kabuk komutları çalıştırın. `process` üzerinden ön plan + arka plan yürütmeyi destekler.
`process` izin verilmiyorsa, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları ajan başına kapsamlanır; `process` yalnızca aynı ajanın oturumlarını görür.

## Parametreler

<ParamField path="command" type="string" required>
Çalıştırılacak kabuk komutu.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Komut için çalışma dizini.
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
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kılın. `timeout: 0` değerini yalnızca komut exec işlem zaman aşımı olmadan çalışmalıysa ayarlayın.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mümkün olduğunda sözde uçbirimde çalıştırın. Yalnızca TTY gerektiren CLI'lar, kodlama ajanları ve terminal arayüzleri için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` olarak çözümlenir.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` yürütmesi için zorlama modu.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` yürütmesi için onay istemi davranışı.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node kimliği/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod isteyin — sandbox'tan yapılandırılmış host yoluna çıkın. `security=full` yalnızca elevated `full` olarak çözümlendiğinde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` olur: oturum için sandbox çalışma zamanı etkin olduğunda sandbox, aksi halde gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bir ana makine adı seçici değildir; ana makine adına benzeyen değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. `auto` içinden çağrı başına `host=node` izinlidir; çağrı başına `host=gateway` yalnızca etkin sandbox çalışma zamanı yokken izinlidir.
- Ek yapılandırma olmadan, `host=auto` yine de "sadece çalışır": sandbox yoksa `gateway` olarak çözümlenir; canlı sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox'tan yapılandırılmış host yoluna çıkar: varsayılan olarak `gateway`, ya da `tools.exec.host=node` olduğunda (veya oturum varsayılanı `host=node` ise) `node`. Yalnızca geçerli oturum/sağlayıcı için yükseltilmiş erişim etkinleştirildiğinde kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından denetlenir.
- `node`, eşleştirilmiş bir Node (eşlikçi uygulama veya başsız Node host'u) gerektirir.
- Birden fazla Node varsa, birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, Node'lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- `timeout`, ön plan, arka plan, `yieldMs`, gateway, sandbox ve Node `system.run` yürütmesi için geçerlidir. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, bu çağrı için exec işlem zaman aşımını devre dışı bırakır.
- Windows dışı host'larda exec, ayarlanmışsa `SHELL` kullanır; `SHELL` `fish` ise fish ile uyumsuz betiklerden kaçınmak için `PATH` içinden `bash` (veya `sh`) tercih eder, ikisi de yoksa `SHELL` değerine geri döner.
- Windows host'larında exec, PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, sonra PATH), ardından Windows PowerShell 5.1'e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili ele geçirmeyi veya enjekte edilmiş kodu önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec aracı bağlamını algılayabilmesi için başlatılan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` içinden engellenir; bunu Gateway host'unda bir terminalde çalıştırın veya mevcut olduğunda sohbetten kanala özgü oturum açma aracını kullanın.
- Önemli: sandbox varsayılan olarak **kapalıdır**. Sandbox kapalıysa, örtük `host=auto` `gateway` olarak çözümlenir. Açık `host=sandbox`, Gateway host'unda sessizce çalışmak yerine kapalı biçimde başarısız olmaya devam eder. Sandbox'ı etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön uç kontrolleri (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkili `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözümlenirse, o dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkinleştirildiğinde, komut çıktı verdiğinde veya başarısız olduğunda otomatik tamamlanma uyandırmasına güvenin. Günlükler, durum, giriş veya müdahale için `process` kullanın; sleep döngüleri, timeout döngüleri veya tekrarlanan yoklamalarla zamanlamayı taklit etmeyin.
- Daha sonra veya bir zamanlamaya göre gerçekleşmesi gereken işler için `exec` sleep/gecikme kalıpları yerine Cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bu süreden uzun çalıştığında tek bir “çalışıyor” bildirimi yayınlar (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): saniye cinsinden varsayılan komut başına exec zaman aşımı. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` exec işlem zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` olarak çözümlenir)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmamışsa gateway + Node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + Node için varsayılandır. Onay/izin listesi davranışı istiyorsanız hem `tools.exec.*` hem de host `~/.openclaw/exec-approvals.json` ayarlarını sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#no-approval-yolo-mode).
- YOLO, `host=auto` değerinden değil host ilkesi varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya Node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda, host exec yapılandırılmış ilkeyi doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön kontrol reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always` zararsız yorumlayıcı/betik çağrılarını yine kalıcılaştırabilir, ancak satır içi eval biçimleri her seferinde istem göstermeye devam eder.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizinlerin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık izin listesi girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikililer. Davranış ayrıntıları için bkz. [Güvenli ikililer](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol kontrolleri için güvenilen ek açık dizinler. `PATH` girdileri hiçbir zaman otomatik olarak güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin` değerleridir.
- `tools.exec.safeBinProfiles`: güvenli ikili başına isteğe bağlı özel argv ilkesi (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: oturum açma kabuğunuzun `PATH` değerini exec ortamına birleştirir. Host yürütmesi için `env.PATH` geçersiz kılmaları reddedilir. Daemon'ın kendisi yine de en düşük düzeyde bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: kapsayıcı içinde `sh -lc` (oturum açma kabuğu) çalıştırır, bu nedenle `/etc/profile` `PATH` değerini sıfırlayabilir. OpenClaw, profil kaynaklandıktan sonra dahili bir ortam değişkeni üzerinden `env.PATH` değerini başa ekler (kabuk enterpolasyonu yoktur); `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca ilettiğiniz engellenmemiş ortam geçersiz kılmaları Node'a gönderilir. `env.PATH` geçersiz kılmaları host yürütmesi için reddedilir ve Node host'ları tarafından yok sayılır. Bir Node'da ek PATH girdilerine ihtiyacınız varsa, Node host hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Ajan başına Node bağlaması (yapılandırmada ajan listesi indeksini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Denetim arayüzü: Nodes sekmesi aynı ayarlar için küçük bir “Exec node binding” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için `/exec` komutunu bağımsız değişken olmadan gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal izin listeleri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. exec'i katı biçimde devre dışı bırakmak için araç ilkesiyle (`tools.deny: ["exec"]` veya ajan başına) reddedin. Açıkça `security=full` ve `ask=off` ayarlamadığınız sürece host onayları yine uygulanır.

## Exec onayları (eşlikçi uygulama / Node host'u)

Sandbox içindeki ajanlar, `exec` Gateway veya Node host'unda çalışmadan önce istek başına onay gerektirebilir.
İlke, izin listesi ve arayüz akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onaylar gerektiğinde, exec aracı `status: "approval-pending"` ve bir onay kimliğiyle hemen döner. Onaylandıktan (veya reddedildikten / zaman aşımına uğradıktan) sonra Gateway sistem olayları yayınlar (`Exec finished` / `Exec denied`). Komut `tools.exec.approvalRunningNoticeMs` sonrasında hâlâ çalışıyorsa, tek bir `Exec running` bildirimi yayınlanır.
Yerel onay kartları/düğmeleri olan kanallarda, ajan önce bu yerel arayüze güvenmeli ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya elle onayın tek yol olduğunu açıkça söylüyorsa elle `/approve` komutu eklemelidir.

## İzin listesi + güvenli ikililer

Elle izin listesi denetimi, çözümlenmiş ikili yol glob'ları ve yalın komut adı glob'ları ile eşleşir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda, kabuk komutları yalnızca her pipeline segmenti izin listesinde veya güvenli ikiliyse otomatik olarak izin verilir. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler, her üst düzey segment izin listesini (güvenli ikililer dahil) karşılamadıkça izin listesi modunda reddedilir. Yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlamaz: zincirlenmiş bir komut yine de her üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Elle yol izin listesi girdileriyle aynı şey değildir. Katı açık güven için `autoAllowSkills` devre dışı kalsın.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili çalıştırılabilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikililer için açık argv ilkesi.
- izin listesi: çalıştırılabilir yollar için açık güven.

`safeBins` öğesini genel bir izin listesi gibi ele almayın ve yorumlayıcı/runtime ikili dosyaları eklemeyin (örneğin `python3`, `node`, `ruby`, `bash`). Bunlara ihtiyacınız varsa açık izin listesi girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/runtime `safeBins` girdilerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerini iskelet olarak oluşturabilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyaları açıkça yeniden `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız, satır içi kod değerlendirme biçimlerinin yine de yeni bir onay gerektirmesi için `tools.exec.strictInlineEval` öğesini etkinleştirin.

Tam ilke ayrıntıları ve örnekler için bkz. [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikili dosyalar ile izin listesi karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Yapıştır (varsayılan olarak parantezli):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` alt aracıdır.
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

- Yalnızca OpenAI/OpenAI Codex modellerinde kullanılabilir.
- Araç ilkesi yine geçerlidir; `allow: ["write"]` örtük olarak `apply_patch` kullanımına izin verir.
- Yapılandırma `tools.exec.applyPatch` altında yer alır.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; aracı OpenAI modelleri için devre dışı bırakmak üzere `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanıyla sınırlı). Bunu yalnızca `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini bilinçli olarak istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox ortamlarında çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
