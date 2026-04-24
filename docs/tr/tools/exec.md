---
read_when:
    - Exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışını hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Exec aracı
x-i18n:
    generated_at: "2026-04-24T09:34:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Çalışma alanında shell komutları çalıştırın. `process` aracılığıyla ön plan + arka plan yürütmeyi destekler.
`process` aracı izinli değilse `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları ajan başına kapsamlanır; `process` yalnızca aynı ajandaki oturumları görür.

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
Bu gecikmeden sonra (ms) komutu otomatik olarak arka plana alır.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` süresini beklemek yerine komutu hemen arka plana alır.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Bu kadar saniye sonra komutu öldürür.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mümkün olduğunda pseudo-terminal içinde çalıştırır. Bunu yalnızca TTY gerektiren CLI'ler, kodlama ajanları ve terminal UI'leri için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nerede çalıştırılacağı. `auto`, sandbox çalışma zamanı etkin olduğunda `sandbox`'a, aksi halde `gateway`'e çözülür.
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
Yükseltilmiş mod isteğinde bulunur — sandbox'tan çıkıp yapılandırılmış host yoluna kaçar. Yalnızca elevated değeri `full` olarak çözülürse `security=full` zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto`'dur: oturum için sandbox çalışma zamanı etkinse sandbox'a, aksi halde gateway'e gider.
- `auto` varsayılan yönlendirme stratejisidir, joker karakter değildir. Çağrı başına `host=node`, `auto` üzerinden izinlidir; çağrı başına `host=gateway` yalnızca sandbox çalışma zamanı etkin değilse izinlidir.
- Ek yapılandırma olmadan bile `host=auto` yine “sadece çalışır”: sandbox yoksa `gateway`'e çözülür; canlı bir sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox'tan çıkıp yapılandırılmış host yoluna kaçar: varsayılan olarak `gateway`, veya `tools.exec.host=node` olduğunda (`host=node` oturum varsayılanıysa da) `node`. Yalnızca geçerli oturum/sağlayıcı için yükseltilmiş erişim etkinse kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından denetlenir.
- `node`, eşleştirilmiş bir Node gerektirir (yardımcı uygulama veya headless Node host).
- Birden çok Node varsa seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, Node'lar için tek shell yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- Windows dışı host'larda exec, ayarlıysa `SHELL` kullanır; `SHELL`, `fish` ise fish ile uyumsuz script'lerden kaçınmak için `PATH`
  içindeki `bash`'i (veya `sh`) tercih eder, sonra ikisi de yoksa `SHELL`'e geri düşer.
- Windows host'larında exec, önce PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, sonra PATH),
  ardından Windows PowerShell 5.1'e geri düşer.
- Host yürütmesi (`gateway`/`node`), ikili dosya ele geçirme veya enjekte edilmiş kodu
  önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, shell/profile kurallarının exec-tool bağlamını algılayabilmesi için oluşturulan komut ortamına `OPENCLAW_SHELL=exec` ayarlar (PTY ve sandbox yürütmesi dahil).
- Önemli: sandboxing varsayılan olarak **kapalıdır**. Sandboxing kapalıysa örtük `host=auto`
  `gateway`'e çözülür. Açık `host=sandbox` ise sessizce
  gateway host'unda çalışmak yerine fail-closed olur. Sandboxing'i etkinleştirin veya onaylarla birlikte `host=gateway` kullanın.
- Yaygın Python/Node shell sözdizimi hataları için script ön kontrolleri yalnızca etkin
  `workdir` sınırı içindeki dosyaları inceler. Bir script yolu `workdir` dışına çözülürse o
  dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işlerde bir kez başlatın ve otomatik
  tamamlanma uyandırması etkinse komut çıktı ürettiğinde veya başarısız olduğunda buna güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; uyku döngüleri, timeout döngüleri veya tekrarlanan yoklamalarla
  zamanlama öykünmeyin.
- Daha sonra veya zamanlı gerçekleşmesi gereken işler için
  `exec` uyku/gecikme desenleri yerine Cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay geçitli exec bu süreden uzun çalıştığında tek bir “running” bildirimi yayar (0 devre dışı bırakır).
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkinse `sandbox`'a, aksi halde `gateway`'e çözülür)
- `tools.exec.security` (varsayılan: sandbox için `deny`, gateway + node için ayarsızsa `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + node için varsayılandır. Onay/izin listesi davranışı istiyorsanız hem `tools.exec.*` değerlerini hem de host `~/.openclaw/exec-approvals.json` dosyasını sıkılaştırın; bkz. [Yürütme onayları](/tr/tools/exec-approvals#no-approval-yolo-mode).
- YOLO, `host=auto` değil, host politika varsayılanlarından gelir (`security=full`, `ask=off`). Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda host exec yapılandırılmış politikayı doğrudan izler; ek bir sezgisel komut gizleme ön filtresi veya script ön kontrol reddetme katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarsız)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always` yine zararsız yorumlayıcı/script çağrılarını kalıcılaştırabilir, ancak satır içi eval biçimleri her seferinde yine istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` değerinin başına eklenecek dizin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık izin listesi girdileri olmadan çalışabilen, yalnızca stdin odaklı güvenli ikili dosyalar. Davranış ayrıntıları için bkz. [Safe bins](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için ek açık güvenilir dizinler. `PATH` girdileri asla otomatik güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin`'dir.
- `tools.exec.safeBinProfiles`: özel safe bin'ler için isteğe bağlı özel argv politikası (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: giriş shell'inizin `PATH` değerini exec ortamına birleştirir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir. Daemon'un kendisi yine de en küçük bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: container içinde `sh -lc` (login shell) çalıştırır; bu yüzden `/etc/profile`, `PATH` değerini sıfırlayabilir.
  OpenClaw, profile kaynaklandıktan sonra `env.PATH` değerini iç bir env değişkeni üzerinden öne ekler (shell interpolation yok);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca sizin geçtiğiniz engellenmemiş env geçersiz kılmaları Node'a gönderilir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir ve Node host'ları tarafından yok sayılır. Node üzerinde ek PATH girdilerine ihtiyacınız varsa
  Node host servis ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Ajan başına Node bağlama (yapılandırmada ajan liste dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes sekmesi aynı ayarlar için küçük bir “Exec node binding” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanlar ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için hiçbir argüman olmadan `/exec` gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec`, yalnızca **yetkili gönderenler** için geçerlidir (kanal izin listeleri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırmaya yazmaz. Exec'i tamamen devre dışı bırakmak için
bunu araç politikası ile reddedin (`tools.deny: ["exec"]` veya ajan başına). Açıkça
`security=full` ve `ask=off` ayarlamadıkça host onayları yine uygulanır.

## Yürütme onayları (yardımcı uygulama / Node host)

Sandboxed ajanlar, exec'in gateway veya node host üzerinde çalışmasından önce istek başına onay gerektirebilir.
Politika, izin listesi ve UI akışı için bkz. [Yürütme onayları](/tr/tools/exec-approvals).

Onay gerektiğinde exec aracı
`status: "approval-pending"` ve bir onay kimliği ile hemen döner. Onaylandığında (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway sistem olayları (`Exec finished` / `Exec denied`) yayar. Komut
`tools.exec.approvalRunningNoticeMs` süresinden daha uzun çalışıyorsa tek bir `Exec running` bildirimi yayılır.
Yerel onay kartları/düğmeleri olan kanallarda ajan önce bu
yerel UI'ye güvenmeli ve yalnızca araç
sonucu sohbet onaylarının mevcut olmadığını veya tek yolun elle onay olduğunu açıkça söylüyorsa manuel `/approve` komutunu eklemelidir.

## İzin listesi + safe bins

Elle izin listesi uygulaması yalnızca **çözümlenmiş ikili dosya yollarıyla** eşleşir (basename eşleşmesi yok). `security=allowlist`
olduğunda shell komutları yalnızca her pipeline segmenti
izin listesinde veya güvenli ikili dosya ise otomatik izinli olur. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler,
izin listesi modunda her üst düzey segment izin listesini karşılamadıkça reddedilir
(güvenli ikili dosyalar dahil). Yönlendirmeler desteklenmez.
Dayanıklı `allow-always` güveni bu kuralı by-pass etmez: zincirli bir komut yine de her
üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, yürütme onaylarında ayrı bir kolaylık yoludur. Elle yol izin listesi girdileriyle
aynı şey değildir. Sıkı açık güven için `autoAllowSkills` kapalı tutulmalıdır.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin odaklı akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili dosya çalıştırılabilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel safe bin'ler için açık argv politikası.
- izin listesi: çalıştırılabilir yollar için açık güven.

`safeBins` alanını genel bir izin listesi gibi kullanmayın ve yorumlayıcı/çalışma zamanı ikili dosyalarını (örneğin `python3`, `node`, `ruby`, `bash`) eklemeyin. Bunlara ihtiyacınız varsa açık izin listesi girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdileri açık profile'lardan yoksunsa uyarır ve `openclaw doctor --fix`, eksik özel `safeBinProfiles` girdilerini iskeletleyebilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyaları açıkça yeniden `safeBins` içine eklerseniz de uyarır.
Yorumlayıcıları açıkça izin listesine alırsanız satır içi kod eval biçimleri yine taze onay gerektirsin diye `tools.exec.strictInlineEval` etkinleştirin.

Tam politika ayrıntıları ve örnekler için bkz. [Yürütme onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Safe bins versus allowlist](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Yoklama isteğe bağlı durum içindir, bekleme döngüleri için değildir. Otomatik tamamlanma uyandırması
etkinse komut çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

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

Yapıştır (varsayılan olarak bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çoklu dosya düzenlemeleri için `exec` alt aracıdır.
Varsayılan olarak OpenAI ve OpenAI Codex modelleri için etkindir. Yapılandırmayı yalnızca
bunu devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

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
- Araç politikası yine uygulanır; `allow: ["write"]`, `apply_patch` için örtük olarak izin verir.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; OpenAI modelleri için aracı devre dışı bırakmak üzere bunu `false` yapın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true`'dur (çalışma alanı içinde sınırlı). `apply_patch` aracının çalışma alanı dizini dışına yazmasını/silmesini bilerek istiyorsanız bunu yalnızca `false` yapın.

## İlgili

- [Yürütme onayları](/tr/tools/exec-approvals) — shell komutları için onay geçitleri
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox'lanmış ortamlarda çalıştırma
- [Arka plan süreci](/tr/gateway/background-process) — uzun süreli exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç politikası ve yükseltilmiş erişim
