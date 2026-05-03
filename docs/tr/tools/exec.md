---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Çalıştırma aracı
x-i18n:
    generated_at: "2026-05-03T21:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında kabuk komutlarını çalıştırın. `process` aracılığıyla ön plan + arka plan yürütmesini destekler.
`process` izinli değilse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları agent başına kapsamlanır; `process` yalnızca aynı agent’tan oturumları görür.

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
Bu gecikmeden sonra komutu otomatik olarak arka plana al (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` beklemek yerine komutu hemen arka plana al.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kıl. `timeout: 0` değerini yalnızca komut exec işlem zaman aşımı olmadan çalışmalıysa ayarla.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mevcut olduğunda sözde terminalde çalıştır. Yalnızca TTY ile çalışan CLI’lar, kodlama agent’ları ve terminal UI’ları için kullan.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, sandbox çalışma zamanı etkinken `sandbox` olarak, aksi halde `gateway` olarak çözümlenir.
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
Yükseltilmiş mod iste - sandbox’tan yapılandırılmış host yoluna çık. `security=full` yalnızca elevated `full` olarak çözümlendiğinde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` olur: oturum için sandbox çalışma zamanı etkinken sandbox, aksi halde gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bir hostname seçici değildir; hostname benzeri değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. `auto` içinden çağrı başına `host=node` kullanılabilir; çağrı başına `host=gateway` yalnızca etkin sandbox çalışma zamanı yokken kullanılabilir.
- Ek yapılandırma olmadan da `host=auto` hâlâ "çalışır": sandbox yoksa `gateway` olarak çözümlenir; canlı sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox’tan yapılandırılmış host yoluna çıkar: varsayılan olarak `gateway`, veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` olduğunda) `node`. Yalnızca geçerli oturum/sağlayıcı için elevated erişim etkinse kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından kontrol edilir.
- `node`, eşlenmiş bir node gerektirir (eşlikçi uygulama veya başsız node hostu).
- Birden çok node mevcutsa, birini seçmek için `exec.node` veya `tools.exec.node` ayarla.
- `exec host=node`, node’lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırıldı.
- `timeout`, ön plan, arka plan, `yieldMs`, gateway, sandbox ve node `system.run` yürütmesine uygulanır. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, bu çağrı için exec işlem zaman aşımını devre dışı bırakır.
- Windows olmayan host’larda exec, ayarlandığında `SHELL` kullanır; `SHELL` `fish` ise, fish ile uyumsuz betiklerden kaçınmak için `PATH` içinden `bash` (veya `sh`) tercih eder, ardından ikisi de yoksa `SHELL` değerine geri döner.
- Windows host’larda exec, PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, ardından PATH),
  sonra Windows PowerShell 5.1’e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili kaçırmayı veya enjekte edilmiş kodu önlemek için `env.PATH` ve loader geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec-tool bağlamını algılayabilmesi için oluşturulan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` içinden engellenir; bunu Gateway hostunda bir terminalde çalıştırın veya mevcutsa sohbetten kanalın yerel oturum açma aracını kullanın.
- Önemli: sandbox varsayılan olarak **kapalıdır**. Sandbox kapalıysa örtük `host=auto`
  `gateway` olarak çözümlenir. Açık `host=sandbox`, Gateway hostunda sessizce çalışmak yerine kapalı hata verir. Sandbox’ı etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön denetimleri (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkin `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözümlenirse, o dosya için ön denetim atlanır.
- Şimdi başlayan uzun süreli işler için, işi bir kez başlatın ve etkin olduğunda, komut çıktı ürettiğinde veya başarısız olduğunda otomatik tamamlanma uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; uyku döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklamalarla zamanlama taklidi yapmayın.
- Daha sonra veya bir zamanlamaya göre gerçekleşmesi gereken işler için `exec` uyku/gecikme kalıpları yerine Cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bundan daha uzun çalıştığında tek bir “çalışıyor” bildirimi yay (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): saniye cinsinden varsayılan komut başına exec zaman aşımı. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0`, exec işlem zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkinken `sandbox` olarak, aksi halde `gateway` olarak çözümlenir)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmamışsa gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + node için varsayılandır. Onay/izin listesi davranışı istiyorsanız hem `tools.exec.*` hem de host `~/.openclaw/exec-approvals.json` değerlerini sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO, `host=auto` değerinden değil, host politikası varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda, host exec yapılandırılmış politikayı doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön denetimi reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi interpreter eval biçimleri her zaman açık onay gerektirir. `allow-always` zararsız interpreter/betik çağrılarını yine kalıcı hale getirebilir, ancak satır içi eval biçimleri her seferinde yine istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizinlerin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikililer. Davranış ayrıntıları için bkz. [Güvenli ikililer](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdileri asla otomatik olarak güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin` dizinleridir.
- `tools.exec.safeBinProfiles`: güvenli ikili başına isteğe bağlı özel argv politikası (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: login-shell `PATH` değerinizi exec ortamına birleştirir. `env.PATH` geçersiz kılmaları host yürütmesi için reddedilir. Daemon’ın kendisi hâlâ en düşük düzeyde bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: kapsayıcı içinde `sh -lc` (login shell) çalıştırır, bu yüzden `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profil kaynaklandıktan sonra `env.PATH` değerini dahili bir env var üzerinden başa ekler (kabuk interpolasyonu yoktur);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca ilettiğiniz engellenmemiş env geçersiz kılmaları node’a gönderilir. `env.PATH` geçersiz kılmaları host yürütmesi için reddedilir ve node hostları tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa, node host hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Agent başına node bağlama (yapılandırmada agent listesi dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Kontrol UI: Nodes sekmesi aynı ayarlar için küçük bir “Exec node binding” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için argümansız `/exec` gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal allowlist’leri/eşleme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırmaya yazmaz. Exec’i kesin olarak devre dışı bırakmak için araç politikasıyla reddedin (`tools.deny: ["exec"]` veya agent başına). Açıkça `security=full` ve `ask=off` ayarlamadığınız sürece host onayları yine geçerlidir.

## Exec onayları (eşlikçi uygulama / node host)

Sandbox içindeki agent’lar, `exec` Gateway veya node hostunda çalışmadan önce istek başına onay gerektirebilir.
Politika, allowlist ve UI akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onaylar gerektiğinde, exec aracı hemen `status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandıktan (veya reddedildikten / zaman aşımına uğradıktan) sonra Gateway sistem olayları yayar (`Exec finished` / `Exec denied`). Komut `tools.exec.approvalRunningNoticeMs` sonrasında hâlâ çalışıyorsa, tek bir `Exec running` bildirimi yayılır.
Yerel onay kartları/düğmeleri olan kanallarda, agent önce bu yerel UI’a güvenmeli ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu açıkça söylediğinde manuel bir `/approve` komutu eklemelidir.

## Allowlist + güvenli ikililer

Manuel allowlist zorlaması, çözümlenmiş ikili yol glob’ları ve yalın komut adı glob’larıyla eşleşir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir, bu yüzden komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir; ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda, kabuk komutlarına yalnızca her pipeline segmenti allowlist’teyse veya güvenli bir ikiliyse otomatik izin verilir. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler, her üst düzey segment allowlist’i (güvenli ikililer dahil) karşılamadığı sürece allowlist modunda reddedilir. Yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlamaz: zincirlenmiş bir komut yine her üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Manuel yol allowlist girdileriyle aynı değildir. Katı açık güven için `autoAllowSkills` devre dışı kalsın.

İki kontrolü farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili yürütülebilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikililer için açık argv politikası.
- allowlist: yürütülebilir yollar için açık güven.

`safeBins` öğesini genel bir izin listesi olarak ele almayın ve yorumlayıcı/çalışma zamanı ikili dosyaları eklemeyin (örneğin `python3`, `node`, `ruby`, `bash`). Bunlara ihtiyacınız varsa açık izin listesi girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerinin iskeletini oluşturabilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı bin dosyalarını açıkça yeniden `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız satır içi kod değerlendirme biçimlerinin yine de yeni bir onay gerektirmesi için `tools.exec.strictInlineEval` öğesini etkinleştirin.

Tam ilke ayrıntıları ve örnekler için [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Safe bin'ler ile izin listesi karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist) bölümlerine bakın.

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
etkinse komut, çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

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

Yapıştır (varsayılan olarak köşeli ayraçlı):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` aracının bir alt aracıdır.
OpenAI ve OpenAI Codex modellerinde varsayılan olarak etkindir. Yapılandırmayı yalnızca
devre dışı bırakmak veya belirli modellerle sınırlandırmak istediğinizde kullanın:

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
- Araç ilkesi yine geçerlidir; `allow: ["write"]` örtük olarak `apply_patch` kullanımına izin verir.
- `deny: ["write"]`, `apply_patch` kullanımını engellemez; `apply_patch` kullanımını açıkça engelleyin veya yama yazmalarının da engellenmesi gerekiyorsa `deny: ["group:fs"]` kullanın.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; aracı OpenAI modelleri için devre dışı bırakmak üzere `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanı içinde). Yalnızca `apply_patch` öğesinin çalışma alanı dizini dışına yazmasını/silmesini bilinçli olarak istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox uygulanmış ortamlarda çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
