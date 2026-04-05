---
read_when:
    - exec aracını kullanıyor veya değiştiriyorsanız
    - stdin veya TTY davranışında hata ayıklıyorsanız
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Exec Aracı
x-i18n:
    generated_at: "2026-04-05T14:12:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Exec aracı

Çalışma alanında kabuk komutları çalıştırın. `process` aracılığıyla ön plan + arka plan yürütmeyi destekler.
`process` izinli değilse `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları aracı başına kapsamlıdır; `process` yalnızca aynı aracıdaki oturumları görür.

## Parametreler

- `command` (zorunlu)
- `workdir` (varsayılan olarak cwd)
- `env` (anahtar/değer geçersiz kılmaları)
- `yieldMs` (varsayılan 10000): gecikmeden sonra otomatik arka plan
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan 1800): süre dolunca sonlandır
- `pty` (bool): kullanılabiliyorsa pseudo-terminal içinde çalıştırır (yalnızca TTY CLI’ları, coding ajanları, terminal UI’leri)
- `host` (`auto | sandbox | gateway | node`): nerede çalıştırılacağı
- `security` (`deny | allowlist | full`): `gateway`/`node` için zorlama modu
- `ask` (`off | on-miss | always`): `gateway`/`node` için onay istemleri
- `node` (string): `host=node` için düğüm kimliği/adı
- `elevated` (bool): yükseltilmiş mod ister (sandbox’tan çıkıp yapılandırılmış ana makine yoluna geçer); yalnızca `elevated`, `full` olarak çözülürse `security=full` zorlanır

Notlar:

- `host` varsayılan olarak `auto` olur: oturum için sandbox çalışma zamanı etkinken sandbox, aksi halde gateway.
- `auto` varsayılan yönlendirme stratejisidir, joker değildir. Çağrı başına `host=node`, `auto` içinden izinlidir; çağrı başına `host=gateway` ise yalnızca etkin bir sandbox çalışma zamanı yoksa izinlidir.
- Ek yapılandırma olmadan `host=auto` yine de “öylece çalışır”: sandbox yoksa `gateway` olarak çözülür; canlı bir sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox’tan çıkıp yapılandırılmış ana makine yoluna geçer: varsayılan olarak `gateway`, veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` ise) `node`. Yalnızca geçerli oturum/sağlayıcı için yükseltilmiş erişim etkinse kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından denetlenir.
- `node`, eşlenmiş bir node gerektirir (eşlikçi uygulama veya başsız node ana makinesi).
- Birden fazla node kullanılabiliyorsa birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, node’lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- Windows dışı ana makinelerde exec, ayarlıysa `SHELL` kullanır; `SHELL` değeri `fish` ise
  fish ile uyumsuz betikleri önlemek için `PATH` içinden `bash` (veya `sh`) tercih edilir,
  ikisi de yoksa `SHELL` değerine geri dönülür.
- Windows ana makinelerde exec, önce PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, sonra PATH),
  sonra Windows PowerShell 5.1’e geri döner.
- Ana makine yürütmesi (`gateway`/`node`), ikili ele geçirme veya enjekte edilmiş kodu
  önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec-tool bağlamını algılayabilmesi için ortaya çıkan komut ortamına `OPENCLAW_SHELL=exec` ayarlar (PTY ve sandbox yürütmesi dahil).
- Önemli: sandbox **varsayılan olarak kapalıdır**. Sandbox kapalıysa örtük `host=auto`
  `gateway` olarak çözülür. Açık `host=sandbox` ise sessizce
  gateway ana makinesinde çalışmak yerine kapalı hatayla başarısız olur. Sandbox’ı etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrol denetimleri (yaygın Python/Node kabuk sözdizimi hataları için), yalnızca
  etkin `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözülürse ilgili
  dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve komut çıktı ürettiğinde veya başarısız olduğunda otomatik
  tamamlama uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; uyku döngüleri, zaman aşımı döngüleri veya tekrarlı yoklama ile
  zamanlama taklit etmeyin.
- Daha sonra veya zamanlanmış olarak gerçekleşmesi gereken işler için
  `exec` uyku/gecikme kalıpları yerine cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay kapılı bir exec bu süreden uzun çalışırsa tek bir “running” bildirimi yayınlar (0 devre dışı bırakır).
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkinken `sandbox`, aksi halde `gateway` olarak çözülür)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlı değilse gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız ana makine exec, gateway + node için varsayılandır. Onaylar/allowlist davranışı istiyorsanız hem `tools.exec.*` hem de ana makine `~/.openclaw/exec-approvals.json` değerlerini sıkılaştırın; bkz. [Exec onayları](/tools/exec-approvals#no-approval-yolo-mode).
- YOLO, `host=auto` değerinden değil, ana makine ilke varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `tools.exec.node` (varsayılan: ayarlı değil)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı değerlendirme biçimleri her zaman açık onay gerektirir. `allow-always` zararsız yorumlayıcı/betik çağrılarını yine de kalıcılaştırabilir, ancak satır içi değerlendirme biçimleri her seferinde istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikililer. Davranış ayrıntıları için bkz. [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için güvenilen ek açık dizinler. `PATH` girdilerine asla otomatik güvenilmez. Yerleşik varsayılanlar `/bin` ve `/usr/bin` olur.
- `tools.exec.safeBinProfiles`: özel safe bin’ler için isteğe bağlı özel argv ilkesi (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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
  ana makine yürütmesinde reddedilir. Daemon’ın kendisi yine de minimal bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: kapsayıcı içinde `sh -lc` (oturum açma kabuğu) çalıştırır, bu nedenle `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, dahili bir ortam değişkeni aracılığıyla (kabuk enterpolasyonu olmadan) profil kaynaklamasından sonra `env.PATH` değerini başa ekler;
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: geçirdiğiniz engellenmemiş env geçersiz kılmaları node’a gönderilir. `env.PATH` geçersiz kılmaları
  ana makine yürütmesinde reddedilir ve node ana makineleri tarafından yok sayılır. Bir node’da ek PATH girdilerine ihtiyacınız varsa,
  node ana makinesi hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara yükleyin.

Aracı başına node bağlama (yapılandırmada agent list index değerini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes sekmesi, aynı ayarlar için küçük bir “Exec node binding” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanlar ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için bağımsız değişken olmadan `/exec` gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili göndericiler** için dikkate alınır (kanal allowlist’leri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. Exec’i kesin olarak devre dışı bırakmak için araç
ilkesi üzerinden reddedin (`tools.deny: ["exec"]` veya aracı başına). Açıkça
`security=full` ve `ask=off` ayarlamadığınız sürece ana makine onayları yine de uygulanır.

## Exec onayları (eşlikçi uygulama / node ana makinesi)

Sandbox içindeki ajanlar, exec komutu gateway veya node ana makinesinde çalışmadan önce istek başına onay gerektirebilir.
İlke, allowlist ve UI akışı için bkz. [Exec onayları](/tools/exec-approvals).

Onay gerektiğinde exec aracı
`status: "approval-pending"` ve bir onay kimliği ile hemen döner. Onaylandıktan sonra (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway sistem olayları yayar (`Exec finished` / `Exec denied`). Komut hâlâ
`tools.exec.approvalRunningNoticeMs` sonrasında çalışıyorsa, tek bir `Exec running` bildirimi yayınlanır.
Yerel onay kartları/düğmeleri olan kanallarda ajan önce bu
yerel UI’ye güvenmeli ve yalnızca araç
sonucu sohbet onaylarının kullanılamadığını veya tek yolun el ile onay olduğunu açıkça söylediğinde manuel `/approve` komutu eklemelidir.

## Allowlist + safe bins

El ile allowlist zorlaması yalnızca **çözülmüş ikili yollarını** eşleştirir (basename eşleşmesi yoktur). `security=allowlist`
olduğunda kabuk komutları yalnızca her boru hattı parçası
allowlist’teyse veya bir safe bin ise otomatik izin alır. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler,
allowlist modunda her üst düzey parça allowlist’i karşılamadıkça reddedilir (safe bin’ler dahil).
Yönlendirmeler desteklenmez.
Kalıcı `allow-always` güveni bu kuralı aşmaz: zincirlenmiş bir komut için yine her
üst düzey parçanın eşleşmesi gerekir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. El ile
yol allowlist girdileriyle aynı şey değildir. Sıkı açık güven için `autoAllowSkills` özelliğini kapalı tutun.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: safe-bin çalıştırılabilir yolları için açık ek güvenilen dizinler.
- `tools.exec.safeBinProfiles`: özel safe bin’ler için açık argv ilkesi.
- allowlist: çalıştırılabilir yollara açık güven.

`safeBins` değerini genel amaçlı bir allowlist olarak değerlendirmeyin ve yorumlayıcı/çalışma zamanı ikilileri eklemeyin (örneğin `python3`, `node`, `ruby`, `bash`). Bunlara ihtiyacınız varsa açık allowlist girdileri kullanın ve onay istemlerini açık tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profil eksikse uyarır ve `openclaw doctor --fix`, eksik özel `safeBinProfiles` girdilerini iskeletleyebilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikilileri açıkça `safeBins` içine geri eklediğinizde de uyarır.
Yorumlayıcıları açıkça allowlist’e alırsanız, satır içi kod değerlendirme biçimlerinin yine yeni bir onay istemesini sağlamak için `tools.exec.strictInlineEval` etkinleştirin.

Tam ilke ayrıntıları ve örnekler için bkz. [Exec onayları](/tools/exec-approvals#safe-bins-stdin-only) ve [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

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
etkinse komut, çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

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

Yapıştır (varsayılan olarak köşeli ayraçlı):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, `exec` aracının yapılandırılmış çok dosyalı düzenlemeler için bir alt aracıdır.
OpenAI ve OpenAI Codex modellerinde varsayılan olarak etkindir. Yapılandırmayı yalnızca
devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Notlar:

- Yalnızca OpenAI/OpenAI Codex modelleri için kullanılabilir.
- Araç ilkesi yine uygulanır; `allow: ["write"]`, `apply_patch` için örtük izin verir.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` olur; OpenAI modelleri için aracı devre dışı bırakmak üzere bunu `false` yapın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` olur (çalışma alanı içinde sınırlı). `apply_patch` aracının çalışma alanı dizini dışına yazmasını/silmesini özellikle istiyorsanız bunu ancak o zaman `false` yapın.

## İlgili

- [Exec Onayları](/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox ortamlarında çalıştırma
- [Background Process](/tr/gateway/background-process) — uzun süreli exec ve process aracı
- [Security](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
