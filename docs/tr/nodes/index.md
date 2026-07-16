---
read_when:
    - iOS/watchOS/Android Node'larını bir Gateway ile eşleştirme
    - Ajan bağlamı için Node tuvalini/kamerasını kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Node''lar: eşleştirme, yetenekler, izinler ve canvas/kamera/ekran/cihaz/bildirimler/sistem için CLI yardımcıları'
title: Node'lar
x-i18n:
    generated_at: "2026-07-16T17:15:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Bir **node**, Gateway'e `role: "node"` ile bağlanan ve `node.invoke` aracılığıyla bir komut yüzeyi (ör. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan yardımcı bir cihazdır (macOS/iOS/watchOS/Android/başsız). Çoğu node, operatör bağlantı noktasındaki Gateway WebSocket'i kullanır. İsteğe bağlı doğrudan Apple Watch node'u, watchOS sıradan uygulamalarda genel amaçlı düşük seviyeli ağ iletişimini engellediği için aynı bağlantı noktasında imzalı HTTPS yoklaması kullanır. Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

Eski aktarım: [Köprü protokolü](/tr/gateway/bridge-protocol) (TCP JSONL; mevcut node'lar için yalnızca tarihsel amaçlıdır).

macOS ayrıca **node modunda** çalışabilir: menü çubuğu uygulaması, Gateway'in
WS sunucusuna bir node olarak bağlanır (böylece `openclaw nodes …` bu Mac üzerinde çalışır). Uygulama,
`openclaw node run` tarafından kullanılan aynı node-host komut yüzeyine yerel Canvas, kamera, ekran,
bildirim ve bilgisayar denetimi komutları ekler. Bu Mac'te
ikinci bir CLI node'u başlatmayın; uygulama, eşleşen CLI node-host çalışma zamanını
dahili bir işçi olarak çalıştırır ve tek Gateway bağlantısı ile node kimliği olmaya devam eder.

Node'lar gateway değil, **çevre birimleridir**: gateway hizmetini çalıştırmazlar ve kanal mesajları (Telegram, WhatsApp vb.) node'lara değil, gateway'e ulaşır.

Sorun giderme çalışma kılavuzu: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleştirme + durum

Node'lar **cihaz eşleştirmesi** kullanır. Bir node, bağlantı sırasında imzalı bir cihaz kimliği sunar; Gateway, `role: node` için bir cihaz eşleştirme isteği oluşturur. Cihazlar CLI'ı (veya kullanıcı arayüzü) üzerinden onaylayın. Doğrudan Apple Watch kurulumu, sabit ve düşük riskli komut yüzeyini onaylamak için yönetici tarafından oluşturulan, kısa ömürlü ve yalnızca node'a özel bir kurulum kodu kullanır; yeteneklerin daha sonra genişletilmesi yine normal onay gerektirir.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bekleyen eşleştirme isteklerinin süresi, cihazın son yeniden denemesinden 5 dakika sonra dolar. Yeniden bağlanmayı sürdüren bir cihaz, birkaç dakikada bir yeni istem oluşturmak yerine tek bekleyen isteğini (ve `requestId`) etkin tutar; tam istek/onay yaşam döngüsü için [Node eşleştirmesi](/tr/gateway/pairing) bölümüne bakın. Bir node, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden denerse önceki bekleyen isteğin yerini yeni bir istek alır ve yeni bir `requestId` oluşturulur. İstemciler, yerini başka isteğin aldığı istek için bir `device.pair.resolved` olayı alır ve onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırmanız gerekir.

- `nodes status`, cihaz eşleştirme rolü `node` içerdiğinde bir node'u **eşleştirilmiş** olarak işaretler.
- Erişilebilirlik iznine sahip bağlı bir yerel Mac, birleştirilmiş
  fiziksel giriş etkinliğini bildirebilir. Gateway, uygun olan en güncel Mac'i
  `active` olarak işaretler, ajana kararlı bir node kimliği ipucu verir ve
  gecikmeli bir geri dönüşten önce node bağlantı uyarılarını oraya yönlendirir. Kurulum, gizlilik, zamanlama ve
  sorun giderme için [Etkin bilgisayar varlığı](/nodes/presence) bölümüne bakın.
- Cihaz eşleştirme kaydı, kalıcı onaylanmış rol sözleşmesidir. Token döndürme bu sözleşmenin sınırları içinde kalır; eşleştirilmiş bir node'u, eşleştirme onayında hiç verilmemiş bir role yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`), node'un yeniden bağlantılar boyunca onaylanmış komut/yetenek yüzeyini izleyen, Gateway'e ait ayrı bir node eşleştirme deposudur. Aktarım kimlik doğrulamasını **denetlemez**; bunu cihaz eşleştirmesi yapar.
- `openclaw nodes remove --node <id|name|ip>`, bir node eşleştirmesini kaldırır. Cihaz destekli bir node için eşleştirilmiş cihaz deposundaki cihazın `node` rolünü iptal eder ve o cihazın node rolüne sahip oturumlarının bağlantısını keser: birden çok role sahip cihaz satırını korur ve yalnızca `node` rolünü kaybeder; yalnızca node rolüne sahip cihaz satırı ise silinir. Ayrıca ayrı node eşleştirme deposundaki eşleşen girdiyi temizler. `operator.pairing`, diğer cihazlardaki operatör olmayan node satırlarını kaldırabilir; birden çok role sahip bir cihazda kendi node rolünü iptal eden cihaz token'ı kullanan bir çağıran ayrıca `operator.admin` gerektirir.
- Onay kapsamı, bekleyen istekte bildirilen komutları izler:
  - komutsuz istek: `operator.pairing`
  - exec dışı node komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Sürüm uyumsuzluğu ve yükseltme sırası

Gateway WebSocket, kimliği doğrulanmış node istemcilerini N-1 protokol aralığında kabul eder.
Bu nedenle mevcut v4 Gateway, bağlantı hem `role: "node"` hem de
`client.mode: "node"` bildirdiğinde v3 node'ları kabul eder. Operatör ve kullanıcı arayüzü oturumları
yine de mevcut protokolü kullanmalıdır.

Aşamalı filo yükseltmelerinde önce Gateway'i, ardından her node'u yükseltin.
Bir N-1 node, yükseltilirken görünür ve yönetilebilir durumda kalır; Gateway,
yükseltme önerisiyle birlikte `legacy node protocol accepted` kaydını oluşturur. Eşleştirme,
cihaz kimlik doğrulaması, komut izin listeleri ve exec onayları geçerliliğini korur.
Plugin'e ait yetenekler ve komutlar, node mevcut protokole
yükseltilene kadar gizli kalır. N-1'den eski node'ların yeniden bağlanmadan önce
bant dışı bir yöntemle yükseltilmesi gerekir.

Doğrudan watchOS HTTPS aktarımı mevcut protokol sürümünü gerektirir; doğrudan modu etkinleştirmeden önce
watch uygulamasını Gateway ile birlikte güncelleyin.

## Uzak node host'u (system.run)

Gateway'iniz bir makinede çalışırken komutların başka bir makinede yürütülmesini istediğinizde bir **node host'u** kullanın. Model yine **gateway** ile iletişim kurar; `host=node` seçildiğinde gateway, `exec` çağrılarını **node host'una** iletir.

| Rol          | Sorumluluk                                                        |
| ------------ | ----------------------------------------------------------------- |
| Gateway host'u | Mesajları alır, modeli çalıştırır, araç çağrılarını yönlendirir. |
| Node host'u  | Node makinesinde `system.run`/`system.which` yürütür.  |
| Onaylar      | Node host'unda `~/.openclaw/exec-approvals.json` aracılığıyla uygulanır.         |

Onay notu:

- Onay destekli node çalıştırmaları, tam istek bağlamına bağlanır. Exec yolu, onaydan önce standart bir `systemRunPlan` hazırlar; onay verildikten sonra gateway, daha sonra çağıran tarafından düzenlenmiş komut/cwd/oturum alanlarını değil, depolanan bu planı iletir ve çalıştırmadan önce çalışma dizinini yeniden doğrular.
- OpenClaw, doğrudan kabuk/çalışma zamanı dosyası yürütmelerinde ayrıca mümkün olan en iyi şekilde tek bir somut yerel dosya işlenenini bağlar ve bu dosya yürütmeden önce değişirse çalıştırmayı reddeder.
- OpenClaw, bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya belirleyemezse eksiksiz çalışma zamanı kapsamı varmış gibi davranmak yerine onay destekli yürütmeyi reddeder. Daha geniş yorumlayıcı semantiği için korumalı alan, ayrı host'lar veya açıkça güvenilen bir izin listesi/tam iş akışı kullanın.

### Node host'unu başlatma (ön plan)

Node makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` ayrıca `--context-path` (Gateway WS bağlam yolu), `--tls`, `--tls-fingerprint <sha256>` ve `--node-id` seçeneklerini kabul eder (eski istemci örneği kimliğini geçersiz kılar; bu, eşleştirmeyi sıfırlamaz).

### SSH tüneli üzerinden uzak gateway (geri döngü bağlaması)

Gateway geri döngüye bağlanıyorsa (`gateway.bind=loopback`, yerel modda varsayılan), uzak node host'ları doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve node host'unu tünelin yerel ucuna yönlendirin.

Örnek (node host'u -> gateway host'u):

```bash
# Terminal A (çalışır durumda tutun): yerel 18790'ı -> gateway 127.0.0.1:18789'a iletin
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway token'ını dışa aktarın ve tünel üzerinden bağlanın
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run`, token veya parola kimlik doğrulamasını destekler.
- Ortam değişkenleri tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Yapılandırma geri dönüşü: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda node host'u, `gateway.remote.token` / `gateway.remote.password` değerlerini kasıtlı olarak yok sayar.
- Uzak modda `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre kullanılabilir.
- Etkin yerel `gateway.auth.*` SecretRef'leri yapılandırılmış ancak çözümlenmemişse node-host kimlik doğrulaması güvenli biçimde başarısız olur.
- Node-host kimlik doğrulaması çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

### Node host'unu başlatma (hizmet)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` ayrıca `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (yalnızca eski istemci örneği kimliği), `--runtime <node>` (varsayılan: node) ve yeniden yükleme için `--force` seçeneklerini kabul eder. `node status`, `node stop` ve `node uninstall` da kullanılabilir.

### Eşleştirme + adlandırma

Gateway host'unda:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node değiştirilmiş kimlik doğrulama ayrıntılarıyla yeniden denerse `openclaw devices list` komutunu yeniden çalıştırın ve mevcut `requestId` değerini onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (istemci örneği kimliği ve Gateway bağlantı meta verileriyle birlikte paylaşılan `node_host_config` SQLite satırında kalıcı olarak saklanır).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway geçersiz kılması).

### Node üzerinde barındırılan MCP sunucuları

MCP sunucularını Gateway'de değil, node makinesindeki `openclaw.json`
içinde yapılandırın:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

Başsız node host'u bu sunucuları başlatır, araçlarını listeler ve bağlandıktan sonra
tanımlayıcıları yayımlar. Araç çağrıları `mcp.tools.call.v1` üzerinden
o node'a geri döner; Gateway'in eşleşen bir MCP yapılandırmasına veya JS
plugin'ine ihtiyacı yoktur. OAuth MCP sunucuları, node üzerinde barındırılan bu v1 yolu tarafından desteklenmez.

Mevcut node host'ları, hiçbir MCP sunucusu yapılandırılmamış olsa bile ilk
eşleştirme sırasında yerleşik `mcp.tools.call.v1` komut ailesini bildirir.
Daha eski bir OpenClaw sürümünde eşleştirilmiş bir node, node host'u
güncellendikten sonra tek seferlik bir komut yüzeyi yükseltmesi isteyebilir. Bundan sonra sunucu eklemek,
kaldırmak veya filtrelemek, onaylanmış komut ailesi değişmediği için
yeniden eşleştirme gerektirmez. Node MCP yapılandırması değişikliklerini uygulamak için
`openclaw node run` veya `openclaw node restart` yeniden başlatılmalıdır;
node host'u bu yapılandırmayı izlemez.

Gateway operatörleri, node üzerinde barındırılan MCP araçları da dahil olmak üzere eşleştirilmiş node'lar tarafından yayımlanan
ajan tarafından görülebilen tüm araçları
`gateway.nodes.pluginTools.enabled: false` ile yok sayabilir. `gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` gibi tam komut
engellemeleri de yürütmeyi engeller.

### Node üzerinde barındırılan Skills

Skills'i node makinesinin etkin OpenClaw Skills dizinine,
varsayılan olarak `~/.openclaw/skills` altına yükleyin. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` ve
`OPENCLAW_CONFIG_PATH` bu etkin profili taşır. Skills için `OPENCLAW_STATE_DIR`
önceliklidir; aksi durumda `skills/`, `openclaw config file` tarafından
yazdırılan yolun yanındadır. Başsız node host'u bağlandıktan sonra geçerli
`SKILL.md` dosyalarını yayımlar ve Gateway bunları yalnızca bu node
bağlı kaldığı sürece ajan Skills anlık görüntülerine ekler. Soyut node bulucunun
başka bir protokol alanı eklemeden tek bir girdiye eşlenebilmesi için her Skills dizininin adı,
`name` frontmatter alanıyla eşleşmelidir.

İlk Node rolü eşleştirmesi Skills yayımlamayı onaylar. Skills eklemek, kaldırmak veya
değiştirmek başka bir eşleştirme ya da Gateway yapılandırması
değişikliği gerektirmez. Node Skills dosyalarını değiştirdikten sonra
`openclaw node run` veya `openclaw node restart` öğesini yeniden başlatın;
Node ana makinesi Skills dizinini izlemez.

Node üzerinde barındırılan Skills girdileri, ait oldukları Node'u tanımlar ve yürütme
konumlarını taşır. Skills dosyaları, göreli olarak başvurulan yollar ve ikili dosyalar o
Node üzerinde kalır. Agent, duyurulan `node://.../SKILL.md` konumunu normal
`read` aracıyla okur. `file_fetch`, Node Skills konum belirleyicilerini
değil, operatör tarafından onaylanmış mutlak Node yollarını kabul eder; normal okuma aracı
bulunmayan çalışma zamanları bunun yerine, duyurulan `node://.../skills/<name>` dizinini
`workdir` olarak kullanıp `cat SKILL.md` komutunu
`exec host=node node=<node-id>` üzerinden çalıştırabilir. Başvurulan dosyalar ve ikili dosyalar
aynı exec hedefini ve çalışma dizinini kullanır. Node ana makinesi bu konum belirleyiciyi
etkin OpenClaw durum dizinine göre çözümler; dolayısıyla göreli yollar Gateway makinesi
yerine Node üzerinde çözümlenir. Yayımlayan Node, `system.run` için onay almış
olmalı ve Agent'ın exec politikası `host=node` öğesine izin vermelidir; aksi
takdirde Skills, ilgili Agent'ın anlık görüntüsüne dahil edilmez.

Yayımlamayı durdurmak için Node üzerinde `nodeHost.skills.enabled: false` değerini ayarlayın. Gateway
operatörleri, `gateway.nodes.skills.enabled: false` ile eşleştirilmiş tüm Node'lardan gelen Skills öğelerini
yok sayabilir.

### Başsız kimlik durumu

Başsız Node üç ayrı durum kaydı tutar:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): istemci örneği kimliği, görünen ad ve Gateway bağlantı meta verileri.
- `~/.openclaw/identity/device.json`: imzalı cihaz anahtar çifti ve bundan türetilen kriptografik cihaz kimliği.
- `~/.openclaw/identity/device-auth.json`: kriptografik cihaz kimliği ve role göre anahtarlanmış eşleştirilmiş cihaz kimlik doğrulama belirteçleri.

İmzalı bir Node için Gateway, eşleştirme ve Node yönlendirmesinde kriptografik cihaz
kimliğini kullanır. İstemci örneği kimliği yalnızca bağlantı meta verisidir.
Bu nedenle `--node-id` değerini değiştirmek veya kullanımdan kaldırılmış bir
`node.json` öğesini taşımak eşleştirmeyi sıfırlamaz. Desteklenen iptal etme ve
yeniden eşleştirme akışı ile yükseltme notları için
[Kimlik ve eşleştirme durumu](/tr/cli/node#identity-and-pairing-state) bölümüne bakın.

### Komutları izin verilenler listesine ekleme

Exec onayları **her Node ana makinesi için ayrıdır**. İzin verilenler listesi girdilerini Gateway üzerinden ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar Node ana makinesinde `~/.openclaw/exec-approvals.json` konumunda bulunur.

### Exec'i Node'a yönlendirme

Varsayılanları yapılandırın (Gateway yapılandırması):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Veya oturum başına:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Ayarlandıktan sonra, `host=node` içeren tüm `exec` çağrıları Node ana makinesinde çalışır (Node izin verilenler listesine/onaylarına tabidir).

`host=auto` kendi başına örtük olarak Node'u seçmez, ancak açık bir çağrı başına
`host=node` isteğine `auto` üzerinden izin verilir. Node exec'in
oturum için varsayılan olmasını istiyorsanız `tools.exec.host=node` veya
`/exec host=node ...` değerini açıkça ayarlayın.

İlgili bölümler:

- [Node ana makinesi CLI'sı](/tr/cli/node)
- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)

### Yerel model çıkarımı

Bir masaüstü veya sunucu Node'u, o Node üzerinde çalışan bir Ollama sunucusundaki sohbet özellikli modelleri kullanıma sunabilir. Agent'lar, yüklü modelleri keşfetmek ve sınırlandırılmış bir istemi uzaktan çalıştırmak için Ollama Plugin'inin `node_inference` aracını kullanır; Gateway'in Ollama'ya doğrudan ağ erişimine ihtiyacı yoktur. Kurulum, model filtreleme ve doğrudan doğrulama komutları için [Ollama Node yerel çıkarımı](/tr/providers/ollama#node-local-inference) bölümüne bakın.

### Codex oturumları ve dökümleri

Resmî `codex` Plugin'i, başsız bir Node ana makinesindeki veya yerel macOS
Node'undaki arşivlenmemiş Codex oturumlarını kullanıma sunabilir. Katalog kaydı artık
`supervision.enabled` seçeneğine bağlı değildir; bu seçenek Agent'a yönelik denetim
araçlarını denetler. Sağlayıcıyı veya çalıştırma altyapısını devre dışı bırakmadan
operatör kataloğunu ve eşleştirilmiş Node katalog komutlarını devre dışı bırakmak için
Codex Plugin yapılandırmasında `sessionCatalog.enabled: false` değerini ayarlayın.
Plugin her iki bilgisayarda da etkin olmalıdır ve Node ayarı yerel onay niteliğini korur:
yalnızca Gateway'i etkinleştirmek başka bir bilgisayarın Codex durumunun okunmasına
izin vermez.

Node, sürümlendirilmiş salt okunur
`codex.appServer.threads.list.v1` ve
`codex.appServer.thread.turns.list.v1` komutlarını duyurur. Codex CLI'ın kullanılabildiği yerel bir Node
ana makinesi ayrıca `codex.terminal.resume.v1` komutunu da duyurur. Bu komutlar ilk kez
göründüğünde Node eşleştirme yükseltmesini onaylayın. Gateway bunları normal Plugin
Node politikası üzerinden çağırır ve hataları ana makineye göre yalıtır.

Eşleştirilmiş Node satırları, normal oturumlar kenar çubuğunda bir **Codex** grubu olarak
görünür. Varsayılan olarak bir satır seçildiğinde normal Sohbet bölmesi açılır ve kalıcı
dökümü, tam öğe projeksiyonuyla sınırlandırılmış ve imleçle sayfalandırılmış
`thread/turns/list` çağrıları üzerinden okunur. Oturumun sahibi olan bilgisayardaki
operatör terminalinde `codex resume <thread-id>` başlatmak için satır menüsünü, görüntüleyici
başlığını veya **Codex/Claude oturumlarını şurada aç** tercihini kullanın. Eşleştirilmiş
Node terminal yolu, rastgele Node komutu yürütme olanağı değil, Codex Plugin'inin
sahip olduğu izin verilenler listesindeki bir PTY aktarıcısıdır.

Aktarıcı, OpenClaw çalıştırma altyapısının tam devam ettirme ve arşiv sahipliği
sözleşmelerini sağlamaz. Bu nedenle uzak satırlarda **Devam Et** ve **Arşivle**
kullanılamaz. Gateway bilgisayarında depolanmış ve boşta olan satırlar, model kilitli
ayrı bir Sohbet dalı başlatabilir. Bunlardan biri, yalnızca operatör başka hiçbir Codex
istemcisinin onu kullanmadığını doğruladıktan sonra arşivlenebilir; depolanmış bir
satırın canlı etkinliği bilinmez. Etkin satırlar dallanamaz veya arşivlenemez.

Kurulum, sayfalandırma, yerel devam ettirme ve meta veri güvenlik sınırı için
[Codex oturumlarını denetleme](/tr/plugins/codex-supervision) bölümüne bakın.

### Claude oturumları ve dökümleri

Birlikte gelen `anthropic` Plugin'i, varsayılan olarak Gateway ve eşleştirilmiş
Node'lar üzerindeki arşivlenmemiş Claude CLI ve Claude Desktop oturumlarını keşfeder.
Anthropic modellerini veya Claude CLI arka ucunu devre dışı bırakmadan operatör
kataloğunu ve eşleştirilmiş Node katalog komutlarını devre dışı bırakmak için
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` değerini ayarlayın.
Uzak bir macOS uygulama Node'u, Anthropic Plugin'i etkinleştirildiğinde ve
`~/.claude/projects/` mevcut olduğunda
`anthropic.claude.sessions.list.v1` ve `anthropic.claude.sessions.read.v1`
komutlarını duyurur. Bu komutlar ilk kez göründüğünde Node eşleştirme yükseltmesini
onaylayın.

Claude CLI'ın kullanılabildiği yerel bir Node ana makinesi ayrıca
`anthropic.claude.terminal.resume.v1` komutunu da duyurur. Uygun CLI ve Desktop satırları,
sahibi olan ana makinedeki operatör terminalinde `claude --resume <session-id>` öğesini açabilir.
Bu, yerel oturumun devralınmasıdır; OpenClaw tarafından benimsenmesinin aksine,
önce Claude oturumunu çatallamaz.

Katalog, geçerli Claude CLI proje dizini kayıtlarını mevcut `sdk-cli` JSONL
dosyalarından alınan sınırlandırılmış bir meta veri önekiyle birleştirir. Claude
Desktop'ın yerel meta verileri, Desktop başlıklarını ve arşiv durumunu sağlar. Her iki
kaynak da aynı Claude Code oturum kimliğine başvurduğunda Desktop meta verileri
önceliklidir; CLI'da arşiv bayrağı bulunmadığından yalnızca CLI'a ait dökümler görünür
kalmaya devam eder. Döküm okumaları opak bayt ofseti imleçlerini ve sınırlandırılmış
geriye doğru dosya okumalarını kullanır; böylece büyük bir oturum seçmek veya eski
bir sayfayı yüklemek tüm JSONL geçmişini tek bir Gateway yanıtına okumaz.

Listeleme ve okuma komutları salt okunurdur. Katalog meta verilerini ve döküm içeriğini,
yalnızca `operator.write` değerine sahip kimliği doğrulanmış bir operatör
bağlantısına genel `sessions.catalog.list` ve
`sessions.catalog.read` yöntemleri üzerinden sunarlar. Gateway'e yerel bir Claude CLI
satırı normal Sohbet oluşturucusundan benimsenebilir: OpenClaw sınırlandırılmış görünür
geçmişi içe aktarır, ilk turda `--fork-session` ile devam eder ve kaynak dökümü
değiştirmeden bırakır.

Başsız bir Node ana makinesi aynı devam ettirme akışını etkinleştirebilir:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node, `agent.cli.claude.run.v1` komutunu yalnızca bu Node'a özel ayar
etkinleştirildiğinde ve `claude` yürütülebilir dosyası o Node üzerinde
çözümlendiğinde duyurur. Gateway bunu uzaktan etkinleştiremez. Komut ayrıca Node'un
mevcut exec onay politikasından geçer. Üç Claude komutunun tümü duyurulduğunda ve
Gateway'in Node komut politikası tarafından izin verildiğinde, o Node üzerindeki bir
Claude CLI satırı devam ettirilebilir hâle gelir: OpenClaw sınırlandırılmış geçmişi içe
aktarır, benimsenen oturumu Node'a ve katalog tarafından bildirilen çalışma dizinine
bağlar ve her tek seferlik `claude -p` turunu orada çalıştırır. İlk tur,
kaynak dökümü koruyarak yine `--fork-session` kullanır.

Node'a yerleştirilen turlar Node'un Claude varsayılanlarını kullanır. v1'de Gateway geri
döngü MCP yapılandırmasını veya Gateway Skills Plugin'ini almazlar, bir Gateway
dökümünden yeniden başlatılamazlar ve eklerle görselleri reddederler. Claude Desktop
satırları ve çalıştırma komutunu duyurmayan Node'lar yalnızca görüntülenebilir. macOS
uygulama Node'u bu komutu henüz duyurmadığından satırları yalnızca görüntülenebilir
durumda kalır.

Control UI davranışı ve depolama kaynakları için
[Anthropic: Bilgisayarlar arasında Claude oturumları](/tr/providers/anthropic#claude-sessions-across-computers)
bölümüne bakın.

### OpenCode ve Pi oturumları

Birlikte gelen OpenCode ve ACPX Plugin'leri de Gateway ve eşleştirilmiş Node'lardaki
salt okunur yerel oturum kataloglarını keşfeder. Bir Node, `opencode`
CLI yüklendiğinde `opencode.sessions.list.v1` / `opencode.sessions.read.v1`
komutlarını ve Pi oturum dizini mevcut olduğunda `acpx.pi.sessions.list.v1` /
`acpx.pi.sessions.read.v1` komutlarını duyurur. Yeni komutlar ilk kez göründüğünde Node
eşleştirme yükseltmesini onaylayın. Eşleşen CLI da kullanılabildiğinde Node,
`opencode.terminal.resume.v1` veya `acpx.pi.terminal.resume.v1` komutunu ekler; mevcut satır menüsü ve
görüntüleyici başlığı, seçilen oturumu sahibi olan terminalde
`opencode --session <id>` veya `pi --session <id>` ile yeniden açabilir.

OpenCode, resmî CLI JSON/dışa aktarma yüzeyi üzerinden okur. Pi, proje ve genel
`settings.json` oturum dizinleri ile `PI_CODING_AGENT_DIR` ve
`PI_CODING_AGENT_SESSION_DIR` geçersiz kılmaları dahil olmak üzere belgelenmiş JSONL oturum
deposunu okur. Her iki katalog da varsayılan olarak etkindir; bunları Web UI'da
**Yapılandırma > Pluginler** altında kapatın.

Terminalde sürdürme, depolanan oturum çalışma dizinini ve Codex ile Claude'un kullandığı
izin verilenler listesindeki aynı çift yönlü PTY aktarıcısını kullanır. Rastgele Node
komutu yürütme olanağı sunmaz.

### Terminal dosyası yüklemeleri

Control UI, dosyaları açık bir eşleştirilmiş Node terminaline sürükleyebilir. Yerel Node
ana makinesi yalnızca yöneticilere açık `terminal.upload` komutunu duyurur; ilk kez
göründüğünde eşleştirme yükseltmesini onaylayın. Her dosya 16 MiB ile sınırlıdır,
o Node üzerindeki özel bir geçici dizinde hazırlanır ve çalıştırılmadan, kabuk için
tırnaklanmış bir yol olarak terminale döndürülür.

Yol ekleme; PowerShell, `cmd.exe` ve tanınan POSIX kabuklarını
(`sh`, Bash, Dash, Ash, Ksh, Zsh ve Fish), Windows'taki Git Bash dahil
olmak üzere destekler. Tırnaklama kuralları güvenli biçimde çıkarılamadığından diğer
kabuk geçersiz kılmaları reddedilir; yerel WSL yolları için Node ana makinesini WSL
içinde çalıştırın. `%` veya `!` içeren
`cmd.exe` yolları da reddedilir; çünkü bu kabuk, söz konusu karakterleri çift
tırnak içinde bile genişletir.

## Komutları çağırma

Düşük düzey (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke`, `system.run` ve `system.run.prepare` komutlarını engeller;
bu komutlar yalnızca `host=node` ile `exec` aracı üzerinden
çalışır (yukarıya bakın). Yaygın "Agent'a bir MEDIA eki verme" iş akışları için daha
yüksek düzeyli yardımcılar mevcuttur (canvas, kamera, ekran, konum; aşağıya bakın).

Uzun süre çalışan akışlı Node komutları, eklemeli `node.invoke.progress`
olaylarını kullanır. Her olay çağırma kimliğini, sıfır tabanlı bir sıra numarasını ve
sınırlandırılmış bir UTF-8 metin parçasını taşır; Gateway, parçaları çağırana
iletmeden önce sıralar. Mevcut `node.invoke.result`, tek nihai
yanıt olarak kalır. Akış çağıranları, ilk ilerleme olayıyla başlayan ve sonraki
ilerlemelerden sonra sıfırlanan bir hareketsizlik süresi sınırı belirleyebilir; bu sırada
onay ve yürütme boyunca çağırmanın ayrı kesin zaman aşımı korunur. Sonuç, kesin
zaman aşımı, hareketsizlik zaman aşımı ve Node bağlantısının kesilmesi, bekleyen akış
durumunu tamamen atar. Çağıranın iptali `node.invoke.cancel` yayar; ardından Node ana bilgisayarı
eşleşen işlem ağacını sonlandırır. Mevcut istek/yanıt komutları değişmez.

## Komut politikası

Node komutlarının çağrılabilmesi için iki denetimden geçmesi gerekir:

1. Node, kimliği doğrulanmış bağlantı meta verilerinde komutu bildirmelidir (`connect.commands`).
2. Gateway'in platform ve onaydan türetilen izin listesi, bildirilen komutu içermelidir.

Platforma göre varsayılan izin listeleri (Plugin varsayılanları ve `allowCommands`/`denyCommands` geçersiz kılmalarından önce):

| Platform | Varsayılan olarak izin verilen komutlar                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (`system.run` gibi Node ana bilgisayarı komutları onaya tabidir; aşağıya bakın)                                                                                                                                                                                                                                  |

Bu satırlar, her Node uygulamasının uyguladığı komutları değil, Gateway politika üst sınırını açıklar. Bir komut yalnızca bağlı Node da bu komutu bildiriyorsa kullanılabilir. Özellikle mevcut macOS uygulaması, macOS politika satırında listelenen cihaz ve kişisel veri ailelerini bildirmez.

`canvas.*` komutları (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) iOS, Android, macOS, Windows, Linux ve bilinmeyen platformlarda bir Plugin varsayılanıdır. Linux Node'ları bunları yalnızca masaüstü uygulamasının yerel Canvas soketi mevcut olduğunda bildirir. Tüm Canvas komutları iOS'ta ön planla sınırlıdır.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once`; platform etiketinden bağımsız olarak, `talk` yeteneğini duyuran veya `talk.*` komutlarını bildiren herhangi bir Node için varsayılan olarak izinlidir.

Masaüstü ana bilgisayarı komutları (macOS/Windows'ta `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` ve `screen.snapshot`) yukarıdaki statik platform varsayılanları tablosunun parçası değildir. Operatör, bunları bildiren bir eşleştirme isteğini onayladığında kullanılabilir hâle gelirler; bundan sonra Node'un onaylanmış komut kümesi, yeniden bağlantılarda bunları korur.

Tehlikeli veya yoğun gizlilik etkisi olan komutlar, bir Node bunları bildirse bile `gateway.nodes.allowCommands` ile açıkça etkinleştirilmelidir: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` her zaman varsayılanlara ve ek izin listesi girdilerine üstün gelir. iPhone onay denetimi için [HealthKit özetleri](/platforms/ios-healthkit), masaüstü girdisi çevresindeki ek macOS, araç politikası ve etkinleştirme denetimleri için [Bilgisayar kullanımı](/tr/nodes/computer-use) bölümüne bakın.

Plugin'e ait Node komutları bir Gateway Node çağırma politikası ekleyebilir. Bu politika, izin listesi denetiminden sonra ve Node'a iletmeden önce çalışır; böylece ham `node.invoke`, CLI yardımcıları ve özel aracı araçları aynı Plugin izin sınırını paylaşır. Tehlikeli Plugin Node komutları yine de açık `gateway.nodes.allowCommands` etkinleştirmesi gerektirir.

Bir Node bildirdiği komut listesini değiştirdikten sonra, Gateway'in güncellenmiş komut anlık görüntüsünü depolaması için eski cihaz eşleştirmesini reddedin ve yeni isteği onaylayın.

## Yapılandırma (`openclaw.json`)

Node ile ilgili ayarlar `gateway.nodes` ve `tools.exec` altında bulunur:

```json5
{
  gateway: {
    nodes: {
      // Güvenilir ağlardan ilk kez yapılan Node eşleştirmesini otomatik olarak onayla (CIDR listesi).
      // Ayarlanmadığında devre dışıdır. Yalnızca istenen kapsamları olmayan ilk
      // role:node isteklerine uygulanır; yükseltmeleri otomatik olarak onaylamaz.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH ile doğrulanan otomatik onay (varsayılan: etkin). SSH üzerinden geri
        // okunan tam cihaz anahtarı eşleşmesinde ilk Node eşleştirmesini onaylar.
        sshVerify: true,
      },
      // Eşleştirilmiş Node'ların yayımladığı aracıya görünür Plugin araçlarına güven (varsayılan: true).
      pluginTools: {
        enabled: true,
      },
      // Tehlikeli/yoğun gizlilik etkisi olan Node komutlarını etkinleştir (camera.snap vb.).
      allowCommands: ["camera.snap", "screen.record"],
      // Varsayılanlar veya allowCommands içerse bile tam komut adlarını engelle.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Varsayılan exec ana bilgisayarı: "node", tüm exec çağrılarını eşleştirilmiş bir Node'a yönlendirir.
      host: "node",
      // Node exec için güvenlik modu: yalnızca onaylanmış/izin listesine alınmış komutlara izin ver.
      security: "allowlist",
      // Exec'i belirli bir Node'a sabitle (kimlik veya ad). Herhangi bir Node'a izin vermek için atla.
      node: "build-node",
    },
  },
}
```

Tam Node komut adlarını kullanın. `denyCommands`, bir platform varsayılanı veya `allowCommands` girdisi normalde izin verse bile komutu kaldırır. Eşleştirilmiş Node'lar varsayılan olarak aracıya görünür Plugin aracı tanımlayıcıları yayımlayabilir, ancak her tanımlayıcının komutu yine de Node'un onaylanmış komut yüzeyinde bulunmalıdır. Bu tür tüm tanımlayıcıları yok saymak için `gateway.nodes.pluginTools.enabled: false` ayarını kullanın. Gateway Node eşleştirmesi ve komut politikası alanlarının ayrıntıları için [Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference#gateway) bölümüne bakın.

Aracı başına exec Node geçersiz kılması:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Ekran görüntüleri (Canvas anlık görüntüleri)

Node Canvas'ı (WebView) gösteriyorsa `canvas.snapshot`, `{ format, base64 }` döndürür.

CLI yardımcısı (geçici bir dosyaya yazar ve kaydedilen yolu yazdırır):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas denetimleri

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notlar:

- `canvas present`, yerel yolları destekleyen Node'larda URL'leri veya yerel dosya yollarını (`--target`) ve konumlandırma için isteğe bağlı `--x/--y/--width/--height` kabul eder. Linux Canvas, HTTP(S) URL'lerini veya paketlenmiş A2UI işleyicisini kabul eder.
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir bağımsız değişken kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Mobil ve Linux masaüstü Node'ları, eylem özellikli işleme için uygulamaya ait paketlenmiş bir A2UI sayfası kullanır.
- Yalnızca A2UI v0.8 JSONL desteklenir (v0.9/createSurface reddedilir).
- iOS ve Android, uzak Gateway Canvas sayfalarını işler; ancak A2UI düğme eylemleri yalnızca uygulamaya ait paketlenmiş A2UI sayfasından gönderilir. Gateway tarafından barındırılan HTTP/HTTPS A2UI sayfaları bu mobil istemcilerde yalnızca işleme amaçlıdır.
- macOS, uygulamanın seçtiği tam yetenek kapsamlı Gateway A2UI sayfasından eylemler gönderebilir. Diğer HTTP/HTTPS sayfaları yalnızca işleme amaçlı kalır.
- Linux, eylemleri yalnızca paketlenmiş A2UI sayfasından gönderir. Diğer HTTP/HTTPS sayfaları yalnızca işleme amaçlı kalır ve masaüstü uygulaması olmayan başsız bir Linux Node'u Canvas'ı duyurmaz.

## Fotoğraflar + videolar (Node kamerası)

Fotoğraflar (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # varsayılan: her iki yön (2 MEDIA satırı)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Video klipleri (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notlar:

- Node, `canvas.*` ve `camera.*` için **ön planda** olmalıdır (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Node'lar, base64 yükünü yönetilebilir tutmak için klip süresini sınırlar (platform başına kesin sınırlar için [Kamera yakalama](/tr/nodes/camera) bölümüne bakın). `nodes` aracı aracı ayrıca çağrıyı iletmeden önce istenen `durationMs` değerini 300000 (5 dakika) ile sınırlar; daha sıkı sınırı Node'un kendisi uygular.
- Android, mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinlerini ister; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (Node'lar)

Desteklenen Node'lar `screen.record` (mp4) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği Node platformuna bağlıdır.
- `nodes` aracı, istenen `durationMs` değerini 300000 (5 dakika) ile sınırlar; Node, döndürülen yükü sınırlamak için daha düşük bir sınır uygulayabilir.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden fazla ekran kullanılabilir olduğunda ekran seçmek için `--screen <index>` kullanın (0 = birincil).

## Konum (Node'lar)

Ayarlar bölümünde Konum etkinleştirildiğinde Node'lar `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum **varsayılan olarak kapalıdır**.
- "Always" sistem izni gerektirir; arka planda alma işlemi mümkün olan en iyi şekilde gerçekleştirilir.
- Yanıt enlem/boylamı, doğruluğu (metre) ve zaman damgasını içerir.
- Parametrelerin/yanıtın tam yapısı ve hata kodları: [Konum komutu](/tr/nodes/location-command).

## SMS (Android Node'ları)

Kullanıcı **SMS** izni verdiğinde ve cihaz telefon hizmetini desteklediğinde Android Node'ları `sms.send` ve `sms.search` sunabilir. Her iki komut da varsayılan olarak tehlikelidir: çağrılabilmeleri için Gateway operatörünün bunları ayrıca `gateway.nodes.allowCommands` listesine eklemesi gerekir (bkz. [Komut politikası](#command-policy)).

Salt okunur SMS araması için `openclaw.json` içinde açıkça etkinleştirin:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Yalnızca Node'un mesaj da gönderebilmesi gerekiyorsa `sms.send` öğesini ayrıca ekleyin. Android izni ile Gateway komut yetkilendirmesi birbirinden bağımsızdır; telefon izninin verilmesi Gateway politikasını düzenlemez.

Düşük düzeyli çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"OpenClaw'dan merhaba"}'
```

Notlar:

- `sms.search`, `READ_SMS` verilmeden önce tanımlanabilir; böylece bir çağrı izin tanılaması döndürebilir. Mesajları okumak için yine de bu Android izni gerekir.
- Telefon hizmeti olmayan yalnızca Wi-Fi özellikli cihazlar `sms.send` özelliğini duyurmaz.
- `requires explicit gateway.nodes.allowCommands opt-in` hatası, telefonun komutu tanımladığı ancak Gateway operatörünün komutu yetkilendirmediği anlamına gelir.

## Cihaz ve kişisel veri komutları

iOS ve Android Node'ları varsayılan olarak çeşitli salt okunur veri komutlarını duyurur (bkz. [Komut politikası](#command-policy) tablosu); Android ayrıca kendi uygulama içi ayarlarıyla denetlenen daha geniş bir komut ailesi sunar.

Kullanılabilir aileler:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — yalnızca Android; `device.apps`, Android Settings içinde Installed Apps paylaşımının etkinleştirilmesini gerektirir ve varsayılan olarak başlatıcıda görünen uygulamaları döndürür.
- `notifications.list`, `notifications.actions` — yalnızca Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (varsayılan olarak salt okunur); `contacts.add` tehlikelidir ve `gateway.nodes.allowCommands` gerektirir.
- `calendar.events` — iOS, Android (varsayılan olarak salt okunur); `calendar.add` tehlikelidir ve `gateway.nodes.allowCommands` gerektirir.
- `reminders.list` — iOS, Android (varsayılan olarak salt okunur); `reminders.add` tehlikelidir ve `gateway.nodes.allowCommands` gerektirir.
- `callLog.search` — yalnızca Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; kullanılabilir sensörlere bağlı olarak özellik denetimine tabidir.

Örnek çağrılar:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Sistem komutları (Node sunucusu / Mac Node'u)

macOS Node'u `system.run`, `system.which`, `system.notify` ve `system.execApprovals.get/set` sunar. Başsız Node sunucusu `system.run.prepare`, `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway hazır"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Notlar:

- `system.run`, yük içinde stdout/stderr/çıkış kodunu döndürür.
- Kabuk yürütme artık `host=node` ile `exec` aracı üzerinden gerçekleştirilir; `nodes`, açık Node komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu, onaydan önce standart bir `systemRunPlan` hazırlar. Onay verildikten sonra Gateway, çağıranın daha sonra düzenlediği komut/cwd/oturum alanlarını değil, saklanan bu planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izni durumuna uyar; `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Tanınmayan Node `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` öğelerini hariç tutan ihtiyatlı bir varsayılan izin listesi kullanır. Bilinmeyen bir platformda bu komutlara bilerek gereksinim duyuyorsanız bunları `gateway.nodes.allowCommands` aracılığıyla açıkça ekleyin.
- `system.run`; `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamındaki `--env` değerleri açık bir izin listesine (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`) indirgenir.
- İzin listesi modundaki her zaman izin ver kararlarında, bilinen gönderim sarmalayıcıları (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcı hâle getirir. Sarmalayıcı güvenli biçimde açılamıyorsa hiçbir izin listesi girdisi otomatik olarak kalıcı hâle getirilmez.
- İzin listesi modundaki Windows Node sunucularında `cmd.exe /c` üzerinden yapılan kabuk sarmalayıcı çalıştırmaları onay gerektirir (tek başına izin listesi girdisi, sarmalayıcı biçimine otomatik olarak izin vermez).
- Node sunucuları, `--env` içindeki `PATH` geçersiz kılmalarını yok sayar ve bir komutu çalıştırmadan önce yorumlayıcı/kabuk başlangıç değişkenlerinden oluşan geniş ve güncel tutulan bir kümeyi (örneğin `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) kaldırır. Ek PATH girdilerine gereksinim duyuyorsanız `--env` aracılığıyla `PATH` geçirmek yerine Node sunucusu hizmet ortamını yapılandırın (veya araçları standart konumlara yükleyin).
- macOS Node modunda `system.run`, macOS uygulamasındaki exec onaylarıyla denetlenir (Settings → Exec approvals). Sor/her zaman izin ver/tam seçenekleri, başsız Node sunucusundakiyle aynı şekilde davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Başsız Node sunucusunda `system.run`, exec onaylarıyla (`~/.openclaw/exec-approvals.json`) denetlenir; özellikle macOS için aşağıdaki [Başsız Node sunucusu](#headless-node-host-cross-platform) bölümündeki exec sunucusu yönlendirme ortam değişkenlerine bakın.

## Exec Node bağlama

Birden fazla Node kullanılabilir olduğunda exec belirli bir Node'a bağlanabilir. Bu, `exec host=node` için varsayılan Node'u ayarlar (ve agent bazında geçersiz kılınabilir).

Genel varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Agent bazında geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Herhangi bir Node'a izin vermek için ayarı kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## İzinler eşlemesi

Node'lar, `node.list` / `node.describe` içinde izin adına göre (ör. `screenRecording`, `accessibility`, `location`) anahtarlanmış ve boole değerleri (`true` = verildi) içeren bir `permissions` eşlemesi barındırabilir.

## Başsız Node sunucusu (platformlar arası)

OpenClaw, Gateway WebSocket'e bağlanan ve `system.run` / `system.which` sunan bir **başsız Node sunucusu** (kullanıcı arayüzü olmadan) çalıştırabilir. Bu, Linux/Windows üzerinde veya bir sunucunun yanında asgari bir Node çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme yine de gereklidir (Gateway bir cihaz eşleştirme istemi gösterir).
- İstemci örneği meta verileri, imzalı cihaz kimliği ve eşleştirme kimlik doğrulaması ayrı dosyalar kullanır; bkz. [Başsız kimlik durumu](#headless-identity-state).
- Exec onayları `~/.openclaw/exec-approvals.json` aracılığıyla yerel olarak uygulanır (bkz. [Exec onayları](/tr/tools/exec-approvals)).
- macOS'ta başsız Node sunucusu varsayılan olarak `system.run` komutunu yerel olarak yürütür. `system.run` komutunu yardımcı uygulamanın exec sunucusu üzerinden yönlendirmek için `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama sunucusunu zorunlu kılmak ve sunucu kullanılamıyorsa kapalı durumda başarısız olmak için `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS, TLS kullanıyorsa `--tls` / `--tls-fingerprint` ekleyin.

## Mac Node modu

- macOS menü çubuğu uygulaması, Gateway WS sunucusuna bir Node olarak bağlanır (böylece `openclaw nodes …` bu Mac ile çalışır).
- Uzak modda uygulama, Gateway bağlantı noktası için bir SSH tüneli açar ve `localhost` adresine bağlanır.
