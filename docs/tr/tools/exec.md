---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Yürütme aracı
x-i18n:
    generated_at: "2026-05-11T20:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında kabuk komutları çalıştırın. `exec`, değişiklik yapabilen bir kabuk yüzeyidir: komutlar, seçilen host veya sandbox dosya sistemi izin verdiği her yerde dosya oluşturabilir, düzenleyebilir veya silebilir. `write`, `edit` veya `apply_patch` gibi OpenClaw dosya sistemi araçlarını devre dışı bırakmak `exec` aracını salt okunur yapmaz.

`process` aracılığıyla ön plan + arka plan yürütmesini destekler. `process` izinli değilse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları agent başına kapsamlanır; `process` yalnızca aynı agent içindeki oturumları görür.

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
Bu gecikmeden sonra komutu otomatik olarak arka plana alır (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` beklemek yerine komutu hemen arka plana alır.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kılar. `timeout: 0` değerini yalnızca komut exec işlem zaman aşımı olmadan çalışmalıysa ayarlayın.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mevcut olduğunda sözde terminalde çalıştırır. Yalnızca TTY ile çalışan CLI’ler, kodlama agent’ları ve terminal kullanıcı arayüzleri için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` olarak çözümlenir.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Normal araç çağrıları için yok sayılır. `gateway` / `node` güvenliği
`tools.exec.security` ve `~/.openclaw/exec-approvals.json` tarafından denetlenir; yükseltilmiş mod
yalnızca operatör açıkça yükseltilmiş erişim verdiğinde `security=full` zorlayabilir.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` yürütmesi için onay istemi davranışı.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node kimliği/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod ister — sandbox’tan yapılandırılmış host yoluna çıkar. `security=full` yalnızca elevated `full` olarak çözümlendiğinde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` olur: oturum için sandbox çalışma zamanı etkinse sandbox, aksi halde gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bir hostname seçici değildir; hostname benzeri değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. `auto` içinden çağrı başına `host=node` izinlidir; çağrı başına `host=gateway` yalnızca etkin sandbox çalışma zamanı yoksa izinlidir.
- Ek yapılandırma olmadan `host=auto` yine de “kendiliğinden çalışır”: sandbox yoksa `gateway` olarak çözümlenir; canlı sandbox varsa sandbox’ta kalır.
- `elevated`, sandbox’tan yapılandırılmış host yoluna çıkar: varsayılan olarak `gateway`, ya da `tools.exec.host=node` olduğunda (veya oturum varsayılanı `host=node` ise) `node`. Yalnızca geçerli oturum/provider için yükseltilmiş erişim etkin olduğunda kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından denetlenir.
- `node`, eşlenmiş bir node gerektirir (companion app veya headless node host).
- Birden fazla node varsa, birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, node’lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- `timeout`, ön plan, arka plan, `yieldMs`, gateway, sandbox ve node `system.run` yürütmesi için geçerlidir. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, bu çağrı için exec işlem zaman aşımını devre dışı bırakır.
- Windows olmayan host’larda exec, ayarlı olduğunda `SHELL` kullanır; `SHELL` `fish` ise fish ile uyumsuz betiklerden kaçınmak için `PATH` üzerinden `bash` (veya `sh`) tercih eder, ardından ikisi de yoksa `SHELL` değerine geri döner.
- Windows host’larda exec, PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, ardından PATH),
  sonra Windows PowerShell 5.1’e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili dosya ele geçirmeyi veya enjekte edilmiş kodu önlemek için `env.PATH` ve loader geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec aracı bağlamını algılayabilmesi için başlatılan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` içinden engellenir; bunu Gateway host üzerinde bir terminalde çalıştırın veya mevcut olduğunda sohbetten kanala özgü giriş aracını kullanın.
- Önemli: sandbox varsayılan olarak **kapalıdır**. Sandbox kapalıysa, örtük `host=auto`
  `gateway` olarak çözümlenir. Açık `host=sandbox` ise sessizce
  gateway host üzerinde çalışmak yerine kapalı durumda başarısız olur. Sandbox’ı etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrol denetimleri (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkili `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışında çözümlenirse, o dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işlerde, işi bir kez başlatın ve etkin olduğunda komut çıktı ürettiğinde veya başarısız olduğunda otomatik tamamlama uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; uyku döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklama ile zamanlamayı taklit etmeyin.
- Daha sonra veya bir takvime göre yapılması gereken işler için `exec` uyku/gecikme desenleri yerine cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bundan daha uzun çalıştığında tek bir “çalışıyor” bildirimi yayımlar (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): saniye cinsinden varsayılan komut başına exec zaman aşımı. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` exec işlem zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkin olduğunda `sandbox`, aksi halde `gateway` olarak çözümlenir)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmamışsa gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + node için varsayılandır. Onay/allowlist davranışı istiyorsanız hem `tools.exec.*` hem de host `~/.openclaw/exec-approvals.json` değerlerini sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO, `host=auto` değerinden değil, host policy varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın ya da `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda host exec, yapılandırılmış policy’yi doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön kontrol reddi katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always` iyi huylu yorumlayıcı/betik çağrılarını yine kalıcı hale getirebilir, ancak satır içi eval biçimleri her seferinde yine istem gösterir.
- `tools.exec.commandHighlighting` (varsayılan: false): true olduğunda, onay istemleri komut metninde ayrıştırıcıdan türetilmiş komut aralıklarını vurgulayabilir. Exec onay policy’sini değiştirmeden komut metni vurgulamayı etkinleştirmek için genel olarak veya agent başına `true` olarak ayarlayın.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizinlerin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikili dosyalar. Davranış ayrıntıları için bkz. [Güvenli ikili dosyalar](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdileri hiçbir zaman otomatik güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin` değerleridir.
- `tools.exec.safeBinProfiles`: güvenli ikili dosya başına isteğe bağlı özel argv policy’si (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: oturum açma kabuğunuzun `PATH` değerini exec ortamına birleştirir. Host yürütmesi için `env.PATH` geçersiz kılmaları reddedilir. Daemon’ın kendisi yine de minimal bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: container içinde `sh -lc` (login shell) çalıştırır, bu yüzden `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profil kaynaklandıktan sonra dahili bir env var üzerinden `env.PATH` değerini başa ekler (kabuk enterpolasyonu yoktur);
  `tools.exec.pathPrepend` burada da geçerlidir.
- `host=node`: yalnızca ilettiğiniz engellenmemiş env geçersiz kılmaları node’a gönderilir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir ve node host’ları tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa,
  node host servis ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Agent başına node bağlama (config içinde agent listesi indeksini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Denetim kullanıcı arayüzü: Nodes sekmesi aynı ayarlar için küçük bir “Exec node bağlama” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için `/exec` komutunu argümansız gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal allowlist’leri/eşleme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve config yazmaz. Exec’i kesin olarak devre dışı bırakmak için tool
policy üzerinden reddedin (`tools.deny: ["exec"]` veya agent başına). Açıkça `security=full` ve `ask=off`
ayarlamadıkça host onayları yine uygulanır.

## Exec onayları (companion app / node host)

Sandbox içindeki agent’lar, `exec` gateway veya node host üzerinde çalışmadan önce istek başına onay gerektirebilir.
Policy, allowlist ve kullanıcı arayüzü akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onaylar gerekli olduğunda, exec aracı hemen `status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandıktan (veya reddedildikten / zaman aşımına uğradıktan) sonra Gateway sistem olayları yayımlar (`Exec finished` / `Exec denied`). Komut `tools.exec.approvalRunningNoticeMs` sonrasında hâlâ çalışıyorsa, tek bir `Exec running` bildirimi yayımlanır.
Yerel onay kartları/düğmeleri olan kanallarda agent önce bu yerel kullanıcı arayüzüne güvenmeli ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu açıkça söylüyorsa manuel `/approve` komutu eklemelidir.

## Allowlist + güvenli ikili dosyalar

Manuel allowlist uygulaması, çözümlenmiş ikili dosya yolu glob’ları ve çıplak komut adı glob’ları ile eşleşir. Çıplak adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda kabuk komutlarına yalnızca her pipeline segmenti allowlist’teyse veya güvenli bir ikili dosyaysa otomatik izin verilir. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler, her üst düzey segment allowlist’i (güvenli ikili dosyalar dahil) karşılamadıkça allowlist modunda reddedilir. Yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlamaz: zincirlenmiş bir komut yine de her üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Manuel yol allowlist girdileriyle aynı değildir. Kesin açık güven için `autoAllowSkills` devre dışı bırakılmış halde tutun.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: safe-bin yürütülebilir dosya yolları için açıkça belirtilmiş ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel safe bin'ler için açık argv politikası.
- izin listesi: yürütülebilir dosya yolları için açık güven.

`safeBins` değerini genel bir izin listesi olarak ele almayın ve yorumlayıcı/runtime ikililerini eklemeyin (örneğin `python3`, `node`, `ruby`, `bash`). Bunlara ihtiyacınız varsa, açık izin listesi girdileri kullanın ve onay istemlerini etkin bırakın.
`openclaw security audit`, yorumlayıcı/runtime `safeBins` girdilerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerini iskeleyebilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı bin'leri açıkça yeniden `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız, satır içi kod değerlendirme biçimlerinin yine de yeni bir onay gerektirmesi için `tools.exec.strictInlineEval` seçeneğini etkinleştirin.

Tam politika ayrıntıları ve örnekler için [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Safe bins ile izin listesi karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist) bölümlerine bakın.

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

Yoklama, bekleme döngüleri için değil, isteğe bağlı durum almak içindir. Otomatik tamamlama uyandırması etkinse, komut çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

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

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` aracının bir alt aracıdır.
OpenAI ve OpenAI Codex modelleri için varsayılan olarak etkindir. Yapılandırmayı yalnızca
onu devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

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
- Araç politikası yine uygulanır; `allow: ["write"]`, `apply_patch` kullanımına örtük olarak izin verir.
- `deny: ["write"]`, `apply_patch` kullanımını reddetmez; `apply_patch` kullanımını açıkça reddedin veya yama yazmalarının da engellenmesi gerekiyorsa `deny: ["group:fs"]` kullanın.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; OpenAI modelleri için aracı devre dışı bırakmak üzere `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanı içinde sınırlı). Bunu yalnızca `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini bilerek istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox ortamlarında çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç politikası ve yükseltilmiş erişim
