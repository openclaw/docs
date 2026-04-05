---
read_when:
    - Exec onaylarını veya allowlist'leri yapılandırıyorsunuz
    - macOS uygulamasında exec onayı UX'ini uyguluyorsunuz
    - Sandbox dışına çıkış istemlerini ve etkilerini gözden geçiriyorsunuz
summary: Exec onayları, allowlist'ler ve sandbox dışına çıkış istemleri
title: Exec Onayları
x-i18n:
    generated_at: "2026-04-05T14:12:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec onayları

Exec onayları, sandbox içindeki bir aracının gerçek bir ana makinede (`gateway` veya `node`)
komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / düğüm ana makinesi korumasıdır**.
Bunu bir güvenlik kilidi gibi düşünün:
komutlara yalnızca ilke + allowlist + (isteğe bağlı) kullanıcı onayı birlikte izin veriyorsa izin verilir.
Exec onayları, araç ilkesi ve yükseltilmiş geçitlemeye **ek olarak** uygulanır (yükseltilmiş mod `full` olarak ayarlanmadıkça; bu durumda onaylar atlanır).
Etkin ilke, `tools.exec.*` ile onay varsayılanlarının **daha katı olanıdır**; bir onay alanı atlanırsa `tools.exec` değeri kullanılır.
Ana makine exec işlemi ayrıca o makinedeki yerel onay durumunu da kullanır. Ana makinede yerel
`~/.openclaw/exec-approvals.json` içindeki `ask: "always"` ayarı,
oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
İstenen ilkeyi,
ana makine ilkesi kaynaklarını ve etkin sonucu incelemek için `openclaw approvals get`, `openclaw approvals get --gateway` veya
`openclaw approvals get --node <id|name|ip>` komutlarını kullanın.

Yardımcı uygulama UI'ı **mevcut değilse**, istem gerektiren her istek
**ask fallback** ile çözülür (varsayılan: deny).

## Nerede uygulanır

Exec onayları yürütmenin yapıldığı ana makinede yerel olarak uygulanır:

- **gateway host** → gateway makinesindeki `openclaw` süreci
- **node host** → düğüm çalıştırıcısı (macOS yardımcı uygulaması veya başsız düğüm ana makinesi)

Güven modeli notu:

- Gateway kimliği doğrulanmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşlenmiş düğümler, bu güvenilir operatör yeteneğini düğüm ana makinesine genişletir.
- Exec onayları kazara yürütme riskini azaltır, ancak kullanıcı başına bir kimlik doğrulama sınırı değildir.
- Onaylı düğüm-ana makinesi çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, mevcutsa env
  bağlama ve uygunsa sabitlenmiş yürütülebilir yol.
- Shell betikleri ve doğrudan yorumlayıcı/runtime dosya çağrıları için OpenClaw ayrıca
  tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlı dosya onaydan sonra ama yürütmeden önce değişirse,
  kaymış içerik yürütülmek yerine çalıştırma reddedilir.
- Bu dosya bağlama, her yorumlayıcı/runtime yükleyici yolunun eksiksiz anlamsal modeli değil,
  kasıtlı olarak en iyi çabadır. Onay modu bağlanacak tam olarak bir somut yerel
  dosyayı belirleyemiyorsa, tam kapsam varmış gibi davranmak yerine onay destekli çalıştırma üretmeyi reddeder.

macOS ayrımı:

- **node host service**, `system.run` çağrılarını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması**, onayları uygular ve komutu UI bağlamında yürütür.

## Ayarlar ve depolama

Onaylar, yürütmenin yapıldığı ana makinede yerel bir JSON dosyasında tutulur:

`~/.openclaw/exec-approvals.json`

Örnek şema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Onaysız "YOLO" modu

Ana makinede exec işleminin onay istemleri olmadan çalışmasını istiyorsanız, **her iki** ilke katmanını da açmanız gerekir:

- OpenClaw yapılandırmasında istenen exec ilkesi (`tools.exec.*`)
- `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel onay ilkesi

Bunu açıkça sıkılaştırmadığınız sürece artık varsayılan ana makine davranışı budur:

- `tools.exec.security`: `gateway`/`node` üzerinde `full`
- `tools.exec.ask`: `off`
- ana makine `askFallback`: `full`

Önemli ayrım:

- `tools.exec.host=auto`, exec işleminin nerede çalışacağını seçer: uygunsa sandbox içinde, aksi takdirde gateway üzerinde.
- YOLO, ana makine exec işleminin nasıl onaylandığını seçer: `security=full` ve `ask=off`.
- `auto`, gateway yönlendirmesini sandbox içindeki bir oturumdan serbest bir geçersiz kılma hâline getirmez. `host=node` için çağrı başına istek `auto` durumundan kabul edilir ve `host=gateway` yalnızca etkin bir sandbox runtime yokken `auto` durumundan kabul edilir. Kararlı bir auto olmayan varsayılan istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` değerini açıkça kullanın.

Daha tutucu bir kurulum istiyorsanız katmanlardan birini `allowlist` / `on-miss`
veya `deny` değerine geri sıkılaştırın.

Kalıcı gateway-host "asla sorma" kurulumu:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Ardından ana makine onay dosyasını da buna uyacak şekilde ayarlayın:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Bir node host için aynı onay dosyasını bunun yerine o düğümde uygulayın:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Yalnızca oturuma özel kısayol:

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, aynı zamanda bu oturum için exec onaylarını da atlayan bir acil durum kısayoludur.

Ana makine onay dosyası yapılandırmadan daha katı kalırsa yine daha katı olan ana makine ilkesi kazanır.

## İlke ayarları

### Güvenlik (`exec.security`)

- **deny**: tüm ana makine exec isteklerini engelle.
- **allowlist**: yalnızca allowlist'e alınmış komutlara izin ver.
- **full**: her şeye izin ver (yükseltilmiş ile eşdeğer).

### Sorma (`exec.ask`)

- **off**: asla sorma.
- **on-miss**: yalnızca allowlist eşleşmediğinde sor.
- **always**: her komutta sor.
- Etkin sorma modu `always` olduğunda `allow-always` kalıcı güveni istemleri bastırmaz

### Sorma geri dönüşü (`askFallback`)

İstem gerekliyse ancak hiçbir UI erişilebilir değilse geri dönüş şu kararı verir:

- **deny**: engelle.
- **allowlist**: yalnızca allowlist eşleşirse izin ver.
- **full**: izin ver.

### Satır içi yorumlayıcı eval sertleştirmesi (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` olduğunda OpenClaw, yorumlayıcı ikilisi
allowlist'te olsa bile satır içi kod-eval biçimlerini yalnızca onayla çalıştırılabilir olarak değerlendirir.

Örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Bu, tek bir kararlı dosya işlenenine temizce eşlenmeyen yorumlayıcı yükleyiciler için ek savunmadır. Katı modda:

- bu komutlar yine de açık onay gerektirir;
- `allow-always`, bunlar için yeni allowlist girdilerini otomatik olarak kalıcılaştırmaz.

## Allowlist (aracı başına)

Allowlist'ler **aracı başınadır**. Birden çok aracı varsa, macOS uygulamasında
düzenlediğiniz aracıyı değiştirin. Desenler **büyük/küçük harf duyarsız glob eşleşmeleridir**.
Desenler **ikili dosya yollarına** çözülmelidir (yalnızca ad tabanlı girdiler yok sayılır).
Eski `agents.default` girdileri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi shell zincirleri için de üst düzey her bölümün allowlist kurallarını sağlaması gerekir.

Örnekler:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her allowlist girdisi şunları izler:

- UI kimliği için kullanılan kararlı UUID **id** (isteğe bağlı)
- **son kullanım** zaman damgası
- **son kullanılan komut**
- **son çözümlenen yol**

## Skill CLI'larını otomatik izinli yap

**Auto-allow skill CLIs** etkin olduğunda, bilinen Skills tarafından başvurulan yürütülebilir dosyalar
düğümlerde (macOS düğümü veya başsız düğüm ana makinesi) allowlist'te sayılır. Bu,
Skill ikili listesi almak için Gateway RPC üzerinden `skills.bins` kullanır. Sıkı manuel allowlist'ler istiyorsanız bunu devre dışı bırakın.

Önemli güven notları:

- Bu, manuel yol allowlist girdilerinden ayrı, **örtük bir kolaylık allowlist'idir**.
- Gateway ile düğümün aynı güven sınırında olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Sıkı açık güven gerektiriyorsanız `autoAllowSkills: false` olarak bırakın ve yalnızca manuel yol allowlist girdilerini kullanın.

## Güvenli ikili dosyalar (yalnızca stdin)

`tools.exec.safeBins`, açık allowlist girdileri olmadan
allowlist modunda çalışabilen küçük bir **yalnızca stdin** ikili dosya listesi tanımlar (örneğin `cut`).
Güvenli ikili dosyalar konumsal dosya argümanlarını ve yol benzeri belirteçleri reddeder,
bu nedenle yalnızca gelen akış üzerinde çalışabilirler.
Bunu genel bir güven listesi değil, akış filtreleri için dar bir hızlı yol olarak değerlendirin.
Yorumlayıcı veya runtime ikili dosyalarını (`python3`, `node`, `ruby`, `bash`, `sh`, `zsh` gibi)
`safeBins` içine **eklemeyin**.
Bir komut tasarım gereği kod değerlendirebiliyorsa, alt komut çalıştırabiliyorsa veya dosya okuyabiliyorsa,
açık allowlist girdilerini tercih edin ve onay istemlerini etkin tutun.
Özel güvenli ikili dosyalar `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
Doğrulama yalnızca argv şekline göre belirlenimcidir (ana makine dosya sistemi varlık denetimleri yoktur), bu da
izin/verme farklarından kaynaklanan dosya varlığı oracle davranışını önler.
Varsayılan güvenli ikili dosyalar için dosya odaklı seçenekler reddedilir (`sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file` gibi).
Güvenli ikili dosyalar, yalnızca stdin davranışını bozan seçenekler için
açık ikili-dosya başına bayrak ilkesi de uygular (`sort -o/--output/--compress-program` ve grep özyinelemeli bayrakları gibi).
Uzun seçenekler, safe-bin modunda fail-closed olarak doğrulanır: bilinmeyen bayraklar ve
belirsiz kısaltmalar reddedilir.
Safe-bin profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikili dosyalar ayrıca argv belirteçlerini yürütme sırasında **literal metin** olarak işlemeye zorlar
(stdin-only bölümleri için globbing ve `$VARS` genişletmesi yoktur); böylece `*` veya `$HOME/...` gibi
örüntüler dosya okuma kaçırmak için kullanılamaz.
Güvenli ikili dosyalar ayrıca güvenilir ikili dizinlerden çözülmelidir (sistem varsayılanları ve isteğe bağlı
`tools.exec.safeBinTrustedDirs` dahil). `PATH` girdileri asla otomatik güvenilir sayılmaz.
Varsayılan güvenilir safe-bin dizinleri kasıtlı olarak küçüktür: `/bin`, `/usr/bin`.
Safe-bin yürütülebilir dosyanız paket yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları açıkça
`tools.exec.safeBinTrustedDirs` içine ekleyin.
Shell zincirleme ve yönlendirmeler allowlist modunda otomatik izinli değildir.

Shell zincirleme (`&&`, `||`, `;`), üst düzey her bölüm allowlist'i sağlıyorsa
(güvenli ikili dosyalar veya Skill auto-allow dahil) izinlidir. Yönlendirmeler allowlist modunda desteklenmez.
Komut ikamesi (`$()` / ters tırnaklar), çift tırnak içinde olsa bile allowlist ayrıştırması sırasında reddedilir;
literal `$()` metnine ihtiyacınız varsa tek tırnak kullanın.
macOS yardımcı uygulama onaylarında, shell denetim veya genişletme söz dizimi içeren ham shell metni
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
shell ikilisinin kendisi allowlist'te değilse allowlist kaçırması sayılır.
Shell sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı env geçersiz kılmaları
küçük ve açık bir allowlist'e indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Allowlist modunda allow-always kararları için bilinen yönlendirme sarmalayıcıları
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir
yolları kalıcılaştırır. Shell çoklayıcıları (`busybox`, `toybox`) da shell applet'leri için (`sh`, `ash`,
vb.) açılır; böylece çoklayıcı ikilileri yerine iç yürütülebilir dosyalar kalıcılaştırılır. Bir sarmalayıcı veya
çoklayıcı güvenli biçimde açılamıyorsa, otomatik olarak hiçbir allowlist girdisi kalıcılaştırılmaz.
`python3` veya `node` gibi yorumlayıcıları allowlist'e alıyorsanız satır içi eval hâlâ açık onay gerektirsin diye `tools.exec.strictInlineEval=true` kullanmayı tercih edin. Katı modda `allow-always` yine zararsız yorumlayıcı/betik çağrılarını kalıcılaştırabilir, ancak satır içi eval taşıyıcıları otomatik olarak kalıcılaştırılmaz.

Varsayılan güvenli ikili dosyalar:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Bunları dahil ederseniz stdin dışı iş akışları için
açık allowlist girdilerini koruyun.
Safe-bin modunda `grep` için örüntüyü `-e`/`--regexp` ile sağlayın;
konumsal örüntü biçimi reddedilir; böylece dosya işlenenleri belirsiz konumsal argümanlar olarak kaçırılamaz.

### Güvenli ikili dosyalar ve allowlist karşılaştırması

| Konu             | `tools.exec.safeBins`                               | Allowlist (`exec-approvals.json`)                          |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| Amaç             | Dar stdin filtrelerine otomatik izin verme          | Belirli yürütülebilir dosyalara açıkça güvenme             |
| Eşleşme türü     | Yürütülebilir adı + safe-bin argv ilkesi            | Çözümlenmiş yürütülebilir yol glob deseni                  |
| Argüman kapsamı  | Safe-bin profili ve literal-token kurallarıyla kısıtlı | Yalnızca yol eşleşmesi; diğer durumlarda argümanlar sizin sorumluluğunuzdadır |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                          | `jq`, `python3`, `node`, `ffmpeg`, özel CLI'lar            |
| En iyi kullanım  | Boru hatlarında düşük riskli metin dönüştürmeleri   | Daha geniş davranışa veya yan etkilere sahip tüm araçlar   |

Yapılandırma konumu:

- `safeBins`, yapılandırmadan gelir (`tools.exec.safeBins` veya aracı başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`, yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya aracı başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`, yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya aracı başına `agents.list[].tools.exec.safeBinProfiles`). Aracı başına profil anahtarları genel anahtarları geçersiz kılar.
- allowlist girdileri ana makineye yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında yaşar (veya Control UI / `openclaw approvals allowlist ...` aracılığıyla).
- `openclaw security audit`, yorumlayıcı/runtime ikili dosyaları açık profiller olmadan `safeBins` içinde görünürse `tools.exec.safe_bins_interpreter_unprofiled` uyarısı verir.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/runtime ikili dosyaları otomatik iskeletlenmez.

Özel profil örneği:
__OC_I18N_900004__
`jq`'yu açıkça `safeBins` içine alırsanız OpenClaw safe-bin
modunda `env` builtin'ini yine reddeder; böylece `jq -n env`, açık bir allowlist yolu
veya onay istemi olmadan ana makine süreç ortamını dökemez.

## Control UI düzenleme

Varsayılanları, aracı başına
geçersiz kılmaları ve allowlist'leri düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir aracı), ilkeyi değiştirin,
allowlist desenleri ekleyin/kaldırın, ardından **Save** düğmesine basın. UI,
listeyi düzenli tutabilmeniz için desen başına **son kullanım** meta verisini gösterir.

Hedef seçici **Gateway** (yerel onaylar) veya bir **Node** seçer. Düğümler
`system.execApprovals.get/set` ilan etmelidir (macOS uygulaması veya başsız düğüm ana makinesi).
Bir düğüm henüz exec onaylarını ilan etmiyorsa yerel
`~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler (bkz. [Approvals CLI](/cli/approvals)).

## Onay akışı

İstem gerektiğinde gateway, operatör istemcilerine `exec.approval.requested` yayını yapar.
Control UI ve macOS uygulaması bunu `exec.approval.resolve` ile çözer, ardından gateway onaylanan
isteği node host'a iletir.

`host=node` için onay istekleri kanonik bir `systemRunPlan` yükü içerir. Gateway,
onaylanmış `system.run` isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, eşzamanlı olmayan onay gecikmesi için önemlidir:

- node exec yolu başta tek bir kanonik plan hazırlar
- onay kaydı bu planı ve bağlama meta verisini saklar
- onaylandıktan sonra son iletilen `system.run` çağrısı
  daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır
- çağıran onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse gateway iletilen
  çalıştırmayı onay uyumsuzluğu olarak reddeder

## Yorumlayıcı/runtime komutları

Onay destekli yorumlayıcı/runtime çalıştırmaları kasıtlı olarak tutucudur:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan shell betiği ve doğrudan runtime dosya biçimleri, en iyi çabayla tek bir somut yerel
  dosya anlık görüntüsüne bağlanır.
- Hâlâ tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/runtime komutu için tam olarak bir somut yerel dosyayı
  belirleyemezse (örneğin paket betikleri, eval biçimleri, runtime'a özgü yükleyici zincirleri veya belirsiz çok dosyalı
  biçimler), anlamsal kapsam varmış gibi iddia etmek yerine onay destekli yürütme reddedilir.
- Bu iş akışları için sandboxing, ayrı bir ana makine sınırı veya operatörün daha geniş runtime anlamlarını kabul ettiği açık
  trusted allowlist/full iş akışını tercih edin.

Onay gerektiğinde exec aracı hemen bir onay kimliğiyle döner. Daha sonraki sistem olaylarıyla
(`Exec finished` / `Exec denied`) ilişkilendirmek için bu kimliği kullanın. Zaman aşımından önce
hiç karar gelmezse istek onay zaman aşımı olarak değerlendirilir ve ret nedeni olarak gösterilir.

### Takip teslim davranışı

Onaylanmış eşzamanlı olmayan exec tamamlandıktan sonra OpenClaw aynı oturuma takip niteliğinde bir `agent` turu gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal ve hedef `to`), takip teslimi bu kanalı kullanır.
- Dış hedefi olmayan yalnızca webchat veya iç oturum akışlarında takip teslimi yalnızca oturumda kalır (`deliver: false`).
- Bir çağıran çözümlenebilir harici kanal olmadan açıkça sıkı harici teslim isterse istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve harici kanal çözümlenemiyorsa teslim başarısız olmak yerine yalnızca oturuma düşürülür.

Onay iletişim kutusu şunları içerir:

- komut + argümanlar
- cwd
- aracı kimliği
- çözümlenmiş yürütülebilir yol
- ana makine + ilke meta verisi

Eylemler:

- **Allow once** → şimdi çalıştır
- **Always allow** → allowlist'e ekle + çalıştır
- **Deny** → engelle

## Sohbet kanallarına onay iletme

Exec onay istemlerini herhangi bir sohbet kanalına (plugin kanalları dahil) iletebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim işlem hattını kullanır.

Yapılandırma:
__OC_I18N_900005__
Sohbette yanıt verin:
__OC_I18N_900006__
`/approve` komutu hem exec onaylarını hem de plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse otomatik olarak bunun yerine plugin onaylarını denetler.

### Plugin onayı iletimi

Plugin onayı iletimi, exec onaylarıyla aynı teslim işlem hattını kullanır ancak
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Birini etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900007__
Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar hem exec hem de
plugin onayları için aynı onay düğmelerini gösterir. Paylaşılan etkileşimli UI'ı olmayan kanallar
`/approve` talimatları içeren düz metne geri döner.

### Herhangi bir kanalda aynı sohbette onaylar

Bir exec veya plugin onay isteği teslim edilebilir bir sohbet yüzeyinden geldiğinde, aynı sohbet
artık varsayılan olarak bunu `/approve` ile onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına ek olarak
Slack, Matrix ve Microsoft Teams gibi kanallar için de geçerlidir.

Bu paylaşılan metin-komut yolu, o konuşma için normal kanal auth modelini kullanır. Kaynak sohbet
zaten komut gönderebiliyor ve yanıt alabiliyorsa onay isteklerinin beklemede kalması için artık
ayrı bir yerel teslim bağdaştırıcısına gerek yoktur.

Discord ve Telegram da aynı sohbette `/approve` desteği sunar, ancak bu kanallar
yerel onay teslimi devre dışı olsa bile yetkilendirme için çözümlenen approver listesini kullanmaya devam eder.

Gateway'i doğrudan çağıran Telegram ve diğer yerel onay istemcileri için,
bu geri dönüş kasıtlı olarak "approval not found" hatalarıyla sınırlıdır. Gerçek bir
exec onayı reddi/hatası sessizce plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar yerel onay istemcileri olarak da çalışabilir. Yerel istemciler,
paylaşılan aynı sohbet `/approve` akışına ek olarak approver DM'leri, kaynak-sohbet
fanout'u ve kanala özgü etkileşimli onay UX'i ekler.

Yerel onay kartları/düğmeleri mevcut olduğunda bu yerel UI
aracıya dönük birincil yoldur. Araç sonucu sohbet onaylarının mevcut olmadığını veya
manuel onayın kalan tek yol olduğunu söylemedikçe aracı ayrıca düz sohbet
`/approve` komutunu yinelememelidir.

Genel model:

- ana makine exec ilkesi hâlâ exec onayı gerekip gerekmediğine karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi olarak davranıp davranmayacağını denetler

Yerel onay istemcileri şu koşulların hepsi doğruysa approver DM öncelikli teslimi otomatik etkinleştirir:

- kanal yerel onay teslimini destekliyordur
- approver'lar açık `execApprovals.approvers` veya o
  kanalın belgelenmiş geri dönüş kaynaklarından çözümlenebiliyordur
- `channels.<channel>.execApprovals.enabled` ayarsızdır veya `"auto"` değerindedir

Bir yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Approver'lar çözümlendiğinde
zorla açmak için `enabled: true` ayarlayın. Genel kaynak-sohbet teslimi
`channels.<channel>.execApprovals.target` ile açık kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan
aynı sohbet `/approve` akışı ve paylaşılan onay düğmeleri üzerine DM yönlendirmesi ve isteğe bağlı kanal fanout'u ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler,
  aynı sohbette `/approve` için normal kanal auth modelini kullanır
- yerel onay istemcisi otomatik etkinleştiğinde varsayılan yerel teslim hedefi approver DM'leridir
- Discord ve Telegram için yalnızca çözümlenen approver'lar onaylayabilir veya reddedebilir
- Discord approver'ları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Telegram approver'ları açık olabilir (`execApprovals.approvers`) veya mevcut owner yapılandırmasından çıkarılabilir (`allowFrom`, artı desteklenen yerlerde doğrudan mesaj `defaultTo`)
- Slack approver'ları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack yerel düğmeleri onay kimliği türünü korur; böylece `plugin:` kimlikleri
  ikinci bir Slack yerel geri dönüş katmanı olmadan plugin onaylarını çözebilir
- Matrix yerel DM/kanal yönlendirmesi yalnızca exec içindir; Matrix plugin onayları paylaşılan
  aynı sohbet `/approve` ve isteğe bağlı `approvals.plugin` iletme yollarında kalır
- isteği yapan kişinin approver olması gerekmez
- kaynak sohbet zaten komutları ve yanıtları destekliyorsa `/approve` ile doğrudan onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri
  doğrudan plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri `/approve` ile aynı sınırlı exec→plugin geri dönüşünü izler
- yerel `target`, kaynak-sohbet teslimini etkinleştirdiğinde onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- hiçbir operatör UI'ı veya yapılandırılmış onay istemcisi isteği kabul edemezse istem `askFallback` değerine geri düşer

Telegram varsayılan olarak approver DM'lerini kullanır (`target: "dm"`). Onay istemlerinin kaynak Telegram sohbetinde/konusunda da görünmesini istiyorsanız bunu `channel` veya `both` olarak değiştirebilirsiniz. Telegram forum konularında OpenClaw, onay istemi ve onay sonrası takip için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900008__
Güvenlik notları:

- Unix soket modu `0600`, token `exec-approvals.json` içinde saklanır.
- Aynı UID eş kontrolü.
- Challenge/response (nonce + HMAC token + istek hash'i) + kısa TTL.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut çalışma bildirimi eşiğini aşarsa)
- `Exec finished`
- `Exec denied`

Bunlar düğüm olayı bildirdikten sonra aracının oturumuna gönderilir.
Gateway-host exec onayları da komut tamamlandığında (ve isteğe bağlı olarak eşikten uzun sürerse çalışırken) aynı yaşam döngüsü olaylarını üretir.
Onay geçitli exec'ler kolay ilişkilendirme için bu iletilerde `runId` olarak onay kimliğini yeniden kullanır.

## Reddedilen onay davranışı

Eşzamanlı olmayan bir exec onayı reddedildiğinde OpenClaw, aracının
oturumdaki aynı komutun daha önceki herhangi bir çalıştırmasından çıktı yeniden kullanmasını engeller. Ret nedeni,
komut çıktısının mevcut olmadığına dair açık yönlendirmeyle birlikte iletilir; bu da
aracının yeni çıktı varmış gibi davranmasını veya önceki başarılı bir çalıştırmadan gelen bayat sonuçlarla
reddedilen komutu yinelemesini durdurur.

## Etkileri

- **full** güçlüdür; mümkün olduğunda allowlist'leri tercih edin.
- **ask**, hızlı onaylara izin verirken sizi de döngünün içinde tutar.
- Aracı başına allowlist'ler, bir aracının onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen ana makine exec isteklerine uygulanır. Yetkisiz gönderenler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar.
  Ana makinede exec'i sert biçimde engellemek için onay güvenliğini `deny` yapın veya araç ilkesiyle `exec` aracını reddedin.

İlgili:

- [Exec aracı](/tools/exec)
- [Yükseltilmiş mod](/tools/elevated)
- [Skills](/tools/skills)

## İlgili

- [Exec](/tools/exec) — shell komutu yürütme aracı
- [Sandboxing](/tr/gateway/sandboxing) — sandbox modları ve çalışma alanı erişimi
- [Security](/tr/gateway/security) — güvenlik modeli ve sertleştirme
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — her biri ne zaman kullanılmalı
