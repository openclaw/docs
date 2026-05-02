---
read_when:
    - exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Yürütme aracı
x-i18n:
    generated_at: "2026-05-02T22:23:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

Çalışma alanında shell komutları çalıştırın. `process` üzerinden ön plan + arka plan yürütmesini destekler.
`process` izin verilmiyorsa, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları agent başına kapsamlanır; `process` yalnızca aynı agent’tan gelen oturumları görür.

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
Bu gecikmeden sonra komutu otomatik olarak arka plana alın (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` beklemek yerine komutu hemen arka plana alın.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Bu çağrı için yapılandırılmış exec zaman aşımını geçersiz kılın. `timeout: 0` değerini yalnızca komut exec işlemi zaman aşımı olmadan çalışması gerektiğinde ayarlayın.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Kullanılabildiğinde sözde terminalde çalıştırın. Yalnızca TTY ile çalışan CLI’ler, kodlama agent’ları ve terminal UI’ları için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede yürütüleceği. `auto`, bir sandbox çalışma zamanı etkinken `sandbox` olarak, aksi halde `gateway` olarak çözümlenir.
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
Yükseltilmiş mod isteyin — sandbox’tan yapılandırılmış ana makine yoluna çıkın. `security=full` yalnızca elevated `full` olarak çözümlendiğinde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` olur: oturum için sandbox çalışma zamanı etkinken sandbox, aksi halde gateway.
- `host` yalnızca `auto`, `sandbox`, `gateway` veya `node` kabul eder. Bu bir ana makine adı seçici değildir; ana makine adına benzer değerler komut çalışmadan önce reddedilir.
- `auto` varsayılan yönlendirme stratejisidir, joker değildir. Çağrı başına `host=node`, `auto` üzerinden kullanılabilir; çağrı başına `host=gateway` yalnızca etkin bir sandbox çalışma zamanı yokken kullanılabilir.
- Ek yapılandırma olmadan da `host=auto` “doğrudan çalışır”: sandbox yoksa `gateway` olarak çözümlenir; canlı bir sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox’tan yapılandırılmış ana makine yoluna çıkar: varsayılan olarak `gateway` veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` olduğunda) `node`. Yalnızca geçerli oturum/sağlayıcı için yükseltilmiş erişim etkinleştirildiğinde kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından kontrol edilir.
- `node`, eşleştirilmiş bir node (yardımcı uygulama veya başsız node ana makinesi) gerektirir.
- Birden fazla node varsa, birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, node’lar için tek shell yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırıldı.
- `timeout`; ön plan, arka plan, `yieldMs`, gateway, sandbox ve node `system.run` yürütmesine uygulanır. Atlanırsa OpenClaw `tools.exec.timeoutSec` kullanır; açık `timeout: 0`, bu çağrı için exec işlemi zaman aşımını devre dışı bırakır.
- Windows dışı ana makinelerde exec, ayarlıysa `SHELL` kullanır; `SHELL` `fish` ise fish ile uyumsuz betiklerden kaçınmak için `PATH` içinden `bash` (veya `sh`) tercih eder, sonra ikisi de yoksa `SHELL` değerine geri döner.
- Windows ana makinelerde exec, PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, sonra PATH),
  ardından Windows PowerShell 5.1’e geri döner.
- Ana makine yürütmesi (`gateway`/`node`), ikili ele geçirmeyi veya enjekte edilmiş kodu önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, shell/profil kurallarının exec aracı bağlamını algılayabilmesi için oluşturulan komut ortamında (PTY ve sandbox yürütmesi dahil) `OPENCLAW_SHELL=exec` ayarlar.
- `openclaw channels login`, etkileşimli bir kanal kimlik doğrulama akışı olduğu için `exec` üzerinden engellenir; bunu gateway ana makinesindeki bir terminalde çalıştırın veya mevcutsa sohbetten kanala özgü giriş aracını kullanın.
- Önemli: sandboxing varsayılan olarak **kapalıdır**. Sandboxing kapalıysa örtük `host=auto`
  `gateway` olarak çözümlenir. Açık `host=sandbox`, gateway ana makinesinde sessizce
  çalışmak yerine kapalı şekilde başarısız olur. Sandboxing’i etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrol denetimleri (yaygın Python/Node shell sözdizimi hataları için) yalnızca etkili `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözümlenirse, o dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkin olduğunda, komut çıktı verdiğinde veya başarısız olduğunda otomatik tamamlama uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; sleep döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklamayla zamanlama taklit etmeyin.
- Daha sonra veya bir programa göre yapılması gereken işler için `exec` sleep/gecikme kalıpları yerine cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bundan uzun çalıştığında tek bir “çalışıyor” bildirimi yayınla (0 devre dışı bırakır).
- `tools.exec.timeoutSec` (varsayılan: 1800): komut başına varsayılan exec zaman aşımı, saniye cinsinden. Çağrı başına `timeout` bunu geçersiz kılar; çağrı başına `timeout: 0` exec işlemi zaman aşımını devre dışı bırakır.
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkinken `sandbox`, aksi halde `gateway` olarak çözümlenir)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmamışsa gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız ana makine exec, gateway + node için varsayılandır. Onaylar/allowlist davranışı istiyorsanız hem `tools.exec.*` hem de ana makine `~/.openclaw/exec-approvals.json` değerlerini sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO, `host=auto` değerinden değil, ana makine ilkesi varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın ya da `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda, ana makine exec yapılandırılmış ilkeyi doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön kontrol reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always`, zararsız yorumlayıcı/betik çağrılarını yine de kalıcılaştırabilir, ancak satır içi eval biçimleri her seferinde istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizinlerin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikililer. Davranış ayrıntıları için bkz. [Güvenli ikililer](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdileri asla otomatik güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin` şeklindedir.
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

- `host=gateway`: oturum açma shell’inizin `PATH` değerini exec ortamıyla birleştirir. `env.PATH` geçersiz kılmaları ana makine yürütmesi için reddedilir. Daemon’ın kendisi yine de minimal bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: konteyner içinde `sh -lc` (login shell) çalıştırır, bu nedenle `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profil kaynaklandıktan sonra dahili bir env var üzerinden `env.PATH` değerini başa ekler (shell enterpolasyonu yoktur);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca ilettiğiniz engellenmemiş env geçersiz kılmaları node’a gönderilir. `env.PATH` geçersiz kılmaları ana makine yürütmesi için reddedilir ve node ana makineleri tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa,
  node ana makine hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara yükleyin.

Agent başına node bağlama (yapılandırmada agent listesi indeksini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Denetim UI’ı: Nodes sekmesi aynı ayarlar için küçük bir “Exec node bağlama” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için `/exec` komutunu argümansız gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili gönderenler** için dikkate alınır (kanal allowlist’leri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. Exec’i kalıcı olarak devre dışı bırakmak için araç ilkesiyle (`tools.deny: ["exec"]` veya agent başına) reddedin. Açıkça `security=full` ve `ask=off` ayarlamadığınız sürece ana makine onayları yine de geçerlidir.

## Exec onayları (yardımcı uygulama / node ana makinesi)

Sandbox’lı agent’lar, `exec` gateway veya node ana makinesinde çalışmadan önce istek başına onay gerektirebilir.
İlke, allowlist ve UI akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onaylar gerektiğinde exec aracı hemen `status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandığında (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway sistem olayları yayınlar (`Exec finished` / `Exec denied`). Komut `tools.exec.approvalRunningNoticeMs` sonrasında hâlâ çalışıyorsa tek bir `Exec running` bildirimi yayınlanır.
Yerel onay kartları/düğmeleri olan kanallarda agent önce bu yerel UI’a güvenmeli ve yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu açıkça söylediğinde manuel bir `/approve` komutu eklemelidir.

## Allowlist + güvenli ikililer

Manuel allowlist zorlaması, çözümlenmiş ikili yol glob’ları ve yalın komut adı glob’larıyla eşleşir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; bu yüzden komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda shell komutları yalnızca her pipeline segmenti allowlist’teyse veya güvenli bir ikiliyse otomatik olarak izinli sayılır. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler, her üst düzey segment allowlist’i (güvenli ikililer dahil) karşılamadıkça allowlist modunda reddedilir. Yönlendirmeler desteklenmemeye devam eder.
Kalıcı `allow-always` güveni bu kuralı atlatmaz: zincirlenmiş bir komut yine her üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. Manuel yol allowlist girdileriyle aynı değildir. Katı açık güven için `autoAllowSkills` devre dışı bırakılmış kalsın.

Farklı işler için iki denetimi kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili yürütülebilir dosya yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikililer için açık argv ilkesi.
- allowlist: yürütülebilir dosya yolları için açık güven.

`safeBins` değerini genel bir izin listesi olarak ele almayın ve yorumlayıcı/çalışma zamanı ikililerini (örneğin `python3`, `node`, `ruby`, `bash`) eklemeyin. Bunlara ihtiyacınız varsa açık izin listesi girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profiller eksik olduğunda uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerini iskelet olarak oluşturabilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikilileri açıkça tekrar `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız satır içi kod değerlendirme biçimlerinin yine de yeni bir onay gerektirmesi için `tools.exec.strictInlineEval` ayarını etkinleştirin.

Tam ilke ayrıntıları ve örnekler için [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikililer ile izin listesi karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist) bölümlerine bakın.

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

- Yalnızca OpenAI/OpenAI Codex modelleri için kullanılabilir.
- Araç ilkesi yine geçerlidir; `allow: ["write"]` örtük olarak `apply_patch` kullanımına izin verir.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; aracı OpenAI modelleri için devre dışı bırakmak üzere `false` olarak ayarlayın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanıyla sınırlı). Bunu yalnızca `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini bilinçli olarak istiyorsanız `false` olarak ayarlayın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox ortamlarında çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve süreç aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
