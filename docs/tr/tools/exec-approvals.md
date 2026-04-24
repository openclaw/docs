---
read_when:
    - '`exec` onaylarını veya izin listelerini yapılandırma'
    - macOS uygulamasında `exec` onay UX’ini uygulama
    - Sandbox’tan çıkış istemlerini ve etkilerini gözden geçirme
summary: Exec onayları, izin listeleri ve sandbox’tan çıkış istemleri
title: Exec onayları
x-i18n:
    generated_at: "2026-04-24T09:34:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

`Exec` onayları, sandbox içindeki bir ajanın gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **tamamlayıcı uygulama / node ana makine korkuluğudur**. Bir güvenlik ara kilidi olarak çalışır: komutlara yalnızca ilke + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte izin verdiğinde izin verilir. `Exec` onayları, araç ilkesi ve yükseltilmiş mod geçitlemesinin **üzerine eklenir** (`elevated` değeri `full` olarak ayarlanmadıkça; bu durumda onaylar atlanır).

<Note>
Etkin ilke, `tools.exec.*` ile onay varsayılanlarının **daha katı olanıdır**;
bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Ana makine `exec`
ayrıca o makinedeki yerel onay durumunu da kullanır — `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel bir `ask: "always"` ayarı, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile istem göstermeye devam eder.
</Note>

## Etkin ilkeyi inceleme

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — istenen ilkeyi, ana makine ilke kaynaklarını ve etkin sonucu gösterir.
- `openclaw exec-policy show` — yerel makinede birleştirilmiş görünüm.
- `openclaw exec-policy set|preset` — yerel istenen ilkeyi yerel ana makine onay dosyasıyla tek adımda eşzamanlar.

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` bu kapsamı
yerel onay dosyasını doğruluk kaynağı gibi göstermeye çalışmak yerine çalışma zamanında node tarafından yönetiliyor olarak bildirir.

Tamamlayıcı uygulama UI’si **kullanılamıyorsa**, normalde istem gösterecek herhangi bir istek
**ask fallback** ile çözülür (varsayılan: deny).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay mesajında kanala özgü kullanım kolaylıkları tohumlayabilir. Örneğin Matrix, yedek olarak mesajdaki `/approve ...`
komutlarını bırakırken tepki kısayollarını (`✅`
bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver) tohumlar.
</Tip>

## Nerede uygulanır

`Exec` onayları, çalıştırma ana makinesinde yerel olarak uygulanır:

- **gateway ana makinesi** → Gateway makinesindeki `openclaw` süreci
- **node ana makinesi** → node çalıştırıcısı (macOS tamamlayıcı uygulaması veya başsız node ana makinesi)

Güven modeli notu:

- Gateway kimliği doğrulanmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşleştirilmiş node’lar bu güvenilir operatör yeteneğini node ana makinesine taşır.
- `Exec` onayları yanlışlıkla çalıştırma riskini azaltır, ancak kullanıcı bazlı bir kimlik doğrulama sınırı değildir.
- Onaylanmış node ana makinesi çalıştırmaları kurallı yürütme bağlamını bağlar: kurallı `cwd`, tam `argv`, varsa `env`
  bağlaması ve uygulanabiliyorsa sabitlenmiş yürütülebilir yol.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosya çağrıları için OpenClaw ayrıca
  tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlı dosya onaydan sonra ancak yürütmeden önce değişirse,
  sapmış içeriği yürütmek yerine çalıştırma reddedilir.
- Bu dosya bağlama, her yorumlayıcı/çalışma zamanı yükleyici yolunun tam anlamsal modeli değil,
  kasıtlı olarak en iyi çaba yaklaşımıdır. Onay modu bağlanacak tam olarak tek bir somut yerel
  dosyayı tanımlayamıyorsa, tam kapsama varmış gibi davranmak yerine onay destekli bir çalıştırma üretmeyi reddeder.

macOS ayrımı:

- **node ana makine hizmeti**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması**, onayları uygular ve komutu UI bağlamında yürütür.

## Ayarlar ve depolama

Onaylar, çalıştırma ana makinesindeki yerel bir JSON dosyasında bulunur:

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

Ana makine `exec` işleminin onay istemleri olmadan çalışmasını istiyorsanız, **her iki** ilke katmanını da açmalısınız:

- OpenClaw yapılandırmasındaki istenen `exec` ilkesi (`tools.exec.*`)
- `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel onay ilkesi

Bunu açıkça sıkılaştırmadığınız sürece bu artık varsayılan ana makine davranışıdır:

- `tools.exec.security`: `gateway`/`node` üzerinde `full`
- `tools.exec.ask`: `off`
- ana makine `askFallback`: `full`

Önemli ayrım:

- `tools.exec.host=auto`, `exec`’in nerede çalışacağını seçer: varsa sandbox içinde, aksi takdirde gateway’de.
- YOLO, ana makine `exec` işleminin nasıl onaylandığını seçer: `security=full` artı `ask=off`.
- Kendi etkileşimsiz izin modunu sunan CLI tabanlı sağlayıcılar bu ilkeyi izleyebilir.
  Claude CLI, OpenClaw’ın istediği `exec` ilkesi
  YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu arka uç davranışını,
  örneğin `--permission-mode default`, `acceptEdits` veya `bypassPermissions`
  kullanarak `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altındaki açık Claude bağımsız değişkenleriyle geçersiz kılın.
- YOLO modunda OpenClaw, yapılandırılmış ana makine `exec` ilkesinin üstüne ayrı bir sezgisel komut gizleme onay geçidi veya betik ön uçuş reddi katmanı eklemez.
- `auto`, sandbox içindeki bir oturumdan gateway yönlendirmesini serbest bir geçersiz kılma hâline getirmez. Çağrı başına `host=node` isteğine `auto` içinden izin verilir ve `host=gateway` yalnızca etkin bir sandbox çalışma zamanı yoksa `auto` içinden izinlidir. Kararlı bir `auto` dışı varsayılan istiyorsanız `tools.exec.host` ayarlayın veya açıkça `/exec host=...` kullanın.

Daha tutucu bir kurulum istiyorsanız katmanlardan birini veya ikisini `allowlist` / `on-miss`
ya da `deny` değerine geri sıkılaştırın.

Kalıcı gateway ana makinesi "asla istem gösterme" kurulumu:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Ardından ana makine onay dosyasını eşleşecek şekilde ayarlayın:

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

Geçerli makinede aynı gateway ana makinesi ilkesi için yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol her ikisini de günceller:

- yerel `tools.exec.host/security/ask`
- yerel `~/.openclaw/exec-approvals.json` varsayılanları

Kasıtlı olarak yalnızca yereldir. Gateway ana makinesi veya node ana makinesi onaylarını
uzaktan değiştirmeniz gerekiyorsa `openclaw approvals set --gateway` veya
`openclaw approvals set --node <id|name|ip>` kullanmaya devam edin.

Bir node ana makinesi için aynı onay dosyasını bunun yerine o node üzerinde uygulayın:

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

Önemli yalnızca-yerel sınırlama:

- `openclaw exec-policy`, node onaylarını eşzamanlamaz
- `openclaw exec-policy set --host node` reddedilir
- node `exec` onayları çalışma zamanında node’dan alınır, bu nedenle node hedefli güncellemelerde `openclaw approvals --node ...` kullanılmalıdır

Yalnızca oturuma özel kısayol:

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, o oturum için `exec` onaylarını da atlayan acil durum kısayoludur.

Ana makine onay dosyası yapılandırmadan daha katı kalırsa, daha katı ana makine ilkesi yine kazanır.

## İlke düğmeleri

### Güvenlik (`exec.security`)

- **deny**: tüm ana makine `exec` isteklerini engelle.
- **allowlist**: yalnızca izin listesindeki komutlara izin ver.
- **full**: her şeye izin ver (yükseltilmiş moda eşdeğer).

### Sor (`exec.ask`)

- **off**: asla istem gösterme.
- **on-miss**: yalnızca izin listesi eşleşmediğinde istem göster.
- **always**: her komutta istem göster.
- Etkin sorma modu `always` olduğunda `allow-always` kalıcı güveni istemleri bastırmaz

### Sorma geri dönüşü (`askFallback`)

Bir istem gerekiyorsa ancak hiçbir UI erişilebilir değilse, geri dönüş şu kararı verir:

- **deny**: engelle.
- **allowlist**: yalnızca izin listesi eşleşirse izin ver.
- **full**: izin ver.

### Satır içi yorumlayıcı eval sertleştirmesi (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` olduğunda OpenClaw, yorumlayıcı ikilisinin kendisi izin listesinde olsa bile satır içi kod değerlendirme biçimlerini yalnızca onaylı olarak ele alır.

Örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Bu, tek bir kararlı dosya işlenenine temiz biçimde eşlenmeyen yorumlayıcı yükleyicileri için derinlikli savunmadır. Katı modda:

- bu komutlar yine de açık onay gerektirir;
- `allow-always`, bunlar için yeni izin listesi girişlerini otomatik olarak kalıcı hâle getirmez.

## İzin listesi (ajan başına)

İzin listeleri **ajan başınadır**. Birden fazla ajan varsa, macOS uygulamasında düzenlediğiniz ajanı değiştirin. Desenler **büyük/küçük harf duyarsız glob eşleşmeleri**dir.
Desenler **ikili yollara** çözülmelidir (yalnızca taban ad içeren girişler yok sayılır).
Eski `agents.default` girişleri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi kabuk zincirlerinde yine de her üst düzey bölümün izin listesi kurallarını karşılaması gerekir.

Örnekler:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her izin listesi girişi şunları izler:

- UI kimliği için kullanılan kararlı UUID **id** (isteğe bağlı)
- **son kullanım** zaman damgası
- **son kullanılan komut**
- **son çözümlenen yol**

## Skill CLI’larını otomatik izinli yap

**Auto-allow skill CLIs** etkinleştirildiğinde, bilinen Skills tarafından başvurulan yürütülebilir dosyalar node’larda (macOS node veya başsız node ana makinesi) izin listesinde kabul edilir. Bu, Skill ikili listesini almak için Gateway RPC üzerinden
`skills.bins` kullanır. Katı elle izin listeleri istiyorsanız bunu devre dışı bırakın.

Önemli güven notları:

- Bu, elle yol izin listesi girdilerinden ayrı olan **örtük bir kolaylık izin listesidir**.
- Gateway ve node’un aynı güven sınırında olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Katı açık güven gerektiriyorsanız `autoAllowSkills: false` olarak bırakın ve yalnızca elle yol izin listesi girdilerini kullanın.

## Güvenli ikililer ve onay yönlendirme

Güvenli ikililer (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları ve
onay istemlerinin Slack/Discord/Telegram’a nasıl yönlendirileceği (veya bunların
yerel onay istemcileri olarak nasıl çalıştırılacağı) için bkz. [Exec approvals — advanced](/tr/tools/exec-approvals-advanced).

<!-- /tools/exec-approvals-advanced konumuna taşındı -->

## Control UI düzenleme

Varsayılanları, ajan başına
geçersiz kılmaları ve izin listelerini düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir ajan), ilkeyi ayarlayın,
izin listesi desenleri ekleyin/kaldırın, sonra **Kaydet**’e basın. UI, listeyi düzenli tutabilmeniz için
desen başına **son kullanım** meta verilerini gösterir.

Hedef seçici **Gateway**’i (yerel onaylar) veya bir **Node**’u seçer. Node’lar
`system.execApprovals.get/set` ilan etmelidir (macOS uygulaması veya başsız node ana makinesi).
Bir node henüz `exec` onaylarını ilan etmiyorsa, yerel
`~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler (bkz. [Approvals CLI](/tr/cli/approvals)).

## Onay akışı

Bir istem gerektiğinde gateway, operatör istemcilerine `exec.approval.requested` yayınlar.
Control UI ve macOS uygulaması bunu `exec.approval.resolve` üzerinden çözer, ardından gateway onaylanmış
isteği node ana makinesine iletir.

`host=node` için onay istekleri, kurallı bir `systemRunPlan` yükü içerir. Gateway,
onaylanmış `system.run` isteklerini iletirken bu planı yetkili komut/`cwd`/oturum bağlamı olarak kullanır.

Bu, eşzamansız onay gecikmesi açısından önemlidir:

- node `exec` yolu önceden tek bir kurallı plan hazırlar
- onay kaydı bu planı ve bağlama meta verilerini depolar
- onaylandıktan sonra son iletilen `system.run` çağrısı, daha sonraki çağıran düzenlemelerine güvenmek yerine
  depolanan planı yeniden kullanır
- çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse gateway iletilen
  çalıştırmayı onay uyuşmazlığı olarak reddeder

## Sistem olayları

`Exec` yaşam döngüsü sistem mesajları olarak yüzeye çıkar:

- `Exec running` (yalnızca komut çalışan bildirim eşiğini aşarsa)
- `Exec finished`
- `Exec denied`

Bunlar, node olayı bildirdikten sonra ajanın oturumuna gönderilir.
Gateway ana makinesi `exec` onayları da komut tamamlandığında aynı yaşam döngüsü olaylarını yayınlar (ve isteğe bağlı olarak eşik süresinden daha uzun çalıştığında da).
Onay geçitli `exec` işlemleri, kolay ilişkilendirme için bu mesajlarda `runId` olarak onay kimliğini yeniden kullanır.

## Reddedilen onay davranışı

Eşzamansız bir `exec` onayı reddedildiğinde OpenClaw, ajanın
oturumda aynı komutun daha önceki bir çalıştırmasından gelen çıktıyı yeniden kullanmasını engeller. Reddetme nedeni,
hiçbir komut çıktısının mevcut olmadığına dair açık yönlendirmeyle iletilir; bu da ajanın yeni çıktı varmış gibi iddia etmesini veya
reddedilen komutu önceki başarılı bir çalıştırmadan kalan bayat sonuçlarla tekrar etmesini durdurur.

## Etkileri

- **full** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **ask**, hızlı onaylara izin verirken sizi de sürecin içinde tutar.
- Ajan başına izin listeleri, bir ajanın onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen ana makine `exec` isteklerine uygulanır. Yetkisiz gönderenler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Ana makine `exec` işlemini kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya `exec` aracını araç ilkesiyle reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli ikililer, yorumlayıcı bağlama ve onayın sohbete yönlendirilmesi.
  </Card>
  <Card title="Exec tool" href="/tr/tools/exec" icon="terminal">
    Kabuk komutu yürütme aracı.
  </Card>
  <Card title="Elevated mode" href="/tr/tools/elevated" icon="shield-exclamation">
    Onayları da atlayan acil durum yolu.
  </Card>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing" icon="box">
    Sandbox modları ve çalışma alanı erişimi.
  </Card>
  <Card title="Security" href="/tr/gateway/security" icon="lock">
    Güvenlik modeli ve sertleştirme.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her denetime ne zaman başvurulmalı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin davranışı.
  </Card>
</CardGroup>
