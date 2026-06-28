---
read_when:
    - Bağlantı/kimlik doğrulama sorunlarınız var ve rehberli düzeltmeler istiyorsunuz
    - Güncellediniz ve hızlı bir doğrulama istiyorsunuz
summary: '`openclaw doctor` için CLI başvurusu (sağlık kontrolleri + rehberli onarımlar)'
title: Doktor
x-i18n:
    generated_at: "2026-06-28T00:22:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway ve kanallar için sağlık denetimleri + hızlı düzeltmeler.

İlgili:

- Sorun giderme: [Sorun giderme](/tr/gateway/troubleshooting)
- Güvenlik denetimi: [Güvenlik](/tr/gateway/security)

## Neden Kullanılır

`openclaw doctor`, OpenClaw sağlık yüzeyidir. Gateway,
kanallar, plugin'ler, Skills, model yönlendirme, yerel durum veya yapılandırma geçişleri
beklendiği gibi davranmadığında ve neyin yanlış olduğunu açıklayabilecek tek bir komut
istediğinizde kullanın.

Doctor'un üç duruşu vardır:

| Duruş   | Komut                    | Davranış                                                                                 |
| ------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| İncele  | `openclaw doctor`        | İnsan odaklı denetimler ve yönlendirmeli istemler.                                       |
| Onar    | `openclaw doctor --fix`  | Etkileşimsiz onarım güvenli olmadığı sürece istemleri kullanarak desteklenen onarımları uygular. |
| Lint    | `openclaw doctor --lint` | CI, preflight ve inceleme kapıları için salt okunur yapılandırılmış bulgular.             |

Otomasyon kararlı bir sonuç gerektirdiğinde `--lint` seçeneğini tercih edin. Bir
insan operatör doctor'ın yapılandırmayı veya durumu bilinçli olarak düzenlemesini istediğinde
`--fix` seçeneğini tercih edin.

## Örnekler

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Kanala özgü izinler için `doctor` yerine kanal problarını kullanın:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Hedefli Discord yetenek probu botun etkin kanal izinlerini raporlar; durum probu yapılandırılmış Discord kanallarını ve sesli otomatik katılım hedeflerini denetler.

## Seçenekler

- `--no-workspace-suggestions`: çalışma alanı belleği/arama önerilerini devre dışı bırak
- `--yes`: sormadan varsayılanları kabul et
- `--repair`: sormadan önerilen servis dışı onarımları uygula; Gateway servis kurulumları ve yeniden yazımları hâlâ etkileşimli onay veya açık Gateway komutları gerektirir
- `--fix`: `--repair` için diğer ad
- `--force`: gerektiğinde özel servis yapılandırmasının üzerine yazmak dahil agresif onarımları uygula
- `--non-interactive`: istem olmadan çalıştır; yalnızca güvenli geçişler ve servis dışı onarımlar
- `--generate-gateway-token`: bir Gateway token'ı oluştur ve yapılandır
- `--allow-exec`: secret'ları doğrularken doctor'ın yapılandırılmış exec SecretRef'lerini yürütmesine izin ver
- `--deep`: ek Gateway kurulumları için sistem servislerini tara ve son Gateway supervisor yeniden başlatma devirlerini raporla
- `--lint`: modernleştirilmiş sağlık denetimlerini salt okunur modda çalıştır ve tanılama bulguları üret
- `--post-upgrade`: yükseltme sonrası Plugin uyumluluk problarını çalıştır; bulguları stdout'a yazar; hata düzeyinde bulgular varsa kod 1 ile çıkar
- `--json`: `--lint` ile insan çıktısı yerine JSON bulguları üret; `--post-upgrade` ile makine tarafından okunabilir bir JSON zarfı (`{ probesRun, findings }`) üret
- `--severity-min <level>`: `--lint` ile `info`, `warning` veya `error` altındaki bulguları düşür
- `--all`: `--lint` ile varsayılan otomasyon kümesinden hariç tutulan isteğe bağlı denetimler dahil tüm kayıtlı denetimleri çalıştır
- `--skip <id>`: `--lint` ile bir denetim id'sini atla; birden fazla atlamak için tekrarla
- `--only <id>`: `--lint` ile yalnızca bir denetim id'sini çalıştır; küçük bir seçili küme çalıştırmak için tekrarla

## Lint modu

`openclaw doctor --lint`, doctor denetimleri için salt okunur otomasyon duruşudur.
Yapılandırılmış sağlık denetimi yolunu kullanır, istem göstermez ve yapılandırmayı/durumu
onarmaz ya da yeniden yazmaz. Yönlendirmeli onarım istemleri yerine makine tarafından
okunabilir bulgular istediğinizde CI, preflight betikleri ve inceleme iş akışlarında kullanın.
`--json`, `--severity-min`, `--all`, `--only` ve `--skip` gibi Lint çıktısı seçenekleri
yalnızca `--lint` ile kabul edilir.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

İnsan çıktısı kompakttır:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON çıktısı, lint çalıştırmaları için betik yüzeyidir:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Çıkış davranışı:

- `0`: seçilen önem eşiğinde veya üstünde bulgu yok
- `1`: en az bir bulgu seçilen eşiği karşılıyor
- `2`: lint bulguları üretilemeden önce komut/çalışma zamanı hatası

`--severity-min`, hem görünür bulguları hem de çıkış eşiğini kontrol eder. Örneğin,
`openclaw doctor --lint --severity-min error`, daha düşük önem düzeyindeki `info` veya
`warning` bulguları mevcut olsa bile hiçbir bulgu yazdırmayıp `0` ile çıkabilir.

`--all`, önem filtrelemesinden önce hangi denetimlerin seçileceğini kontrol eder.
Varsayılan lint çalıştırması kararlı otomasyon kapısıdır ve derin, tarihsel veya
onarılabilir eski kalıntıları ortaya çıkarma olasılığı daha yüksek olduğu için bilinçli
olarak isteğe bağlı tutulan denetimleri hariç tutar. Her denetim id'sini listelemeden
tam lint envanterini istediğinizde `--all` kullanın. `--only <id>` en kesin seçici
olmaya devam eder ve kayıtlı herhangi bir denetimi id ile çalıştırabilir.

## Yapılandırılmış Sağlık Denetimleri

Modern doctor denetimleri küçük bir yapılandırılmış sözleşme kullanır:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`, `doctor --lint` için güç sağlar. `repair()` isteğe bağlıdır ve yalnızca
`doctor --fix` / `doctor --repair` tarafından dikkate alınır. Bu şekle geçirilmemiş
denetimler eski doctor katkı akışını kullanmaya devam eder.

Bu ayrım bilinçlidir: `detect()` tanılamayı sahiplenirken `repair()` neyi değiştirdiğini
veya değiştireceğini raporlamayı sahiplenir. Onarım bağlamları `dryRun`/`diff` istekleri
taşıyabilir ve onarım sonuçları yapılandırma/dosya düzenlemeleri için yapılandırılmış
`diffs`, servis, süreç, paket, durum veya diğer yan etkiler için de `effects`
döndürebilir. Bu, dönüştürülmüş denetimlerin mutasyon planlamasını `detect()` içine
taşımadan `doctor --fix --dry-run` ve diff raporlamasına doğru büyümesini sağlar.

`repair()`, istenen onarımı deneyip denemediğini `status:
"repaired" | "skipped" | "failed"` ile raporlar. Atlanan durum `repaired` anlamına
gelir, bu nedenle basit onarım denetimlerinin yalnızca değişiklikleri döndürmesi yeterlidir.
Onarım `skipped` veya `failed` döndürdüğünde, doctor nedeni raporlar ve o denetim için
doğrulama çalıştırmaz.

Başarılı bir yapılandırılmış onarımdan sonra doctor, onarılmış bulguları kapsam olarak
kullanarak `detect()` işlevini yeniden çalıştırır. Denetimler odaklı doğrulama için seçili
bulguları, yolları veya `ocPath` değerlerini kullanabilir. Bulgu hâlâ mevcutsa doctor
değişikliği sessizce tamamlanmış saymak yerine bir onarım uyarısı raporlar.

Bir bulgu şunları içerir:

| Alan              | Amaç                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Atla/yalnızca filtreleri ve CI allowlist'leri için kararlı id. |
| `severity`        | `info`, `warning` veya `error`.                        |
| `message`         | İnsan tarafından okunabilir sorun ifadesi.             |
| `path`            | Varsa yapılandırma, dosya veya mantıksal yol.           |
| `line` / `column` | Varsa kaynak konumu.                                   |
| `ocPath`          | Bir denetim işaret edebiliyorsa kesin `oc://` adresi.  |
| `fixHint`         | Önerilen operatör eylemi veya onarım özeti.            |

Modernleştirilmiş çekirdek doctor denetimleri, insan odaklı `doctor` / `doctor --fix`
davranışlarını sahiplenen sıralı doctor katkısına bağlı kalır. Paylaşılan yapılandırılmış
sağlık kaydı uzantı noktasıdır: paketli ve plugin destekli denetimler, sahip paketleri
etkin komut yolunda kaydettikten sonra çekirdek doctor denetimlerinin ardından çalışır.
`openclaw/plugin-sdk/health` alt yolu, bu uzantı tüketicileri için aynı sözleşmeyi
sunar.

## Denetim Seçimi

Bir iş akışı odaklı bir kapı istediğinde `--only` ve `--skip` kullanın:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` ve `--skip` tam denetim id'lerini kabul eder ve tekrarlanabilir. Bir `--only`
id'si kayıtlı değilse, o id için hiçbir denetim çalışmaz; odaklı bir kapının beklediğiniz
denetimleri seçtiğini doğrulamak için komutun `checksRun` ve `checksSkipped` alanlarını
kullanın.

## Yükseltme Sonrası Mod

`openclaw doctor --post-upgrade`, bir derleme veya yükseltmeden sonra zincirlenmek üzere
tasarlanmış Plugin uyumluluk problarını çalıştırır. Bulgular stdout'a yazılır; herhangi
bir bulguda `level: "error"` varsa komut kod 1 ile çıkar. CI, topluluk `fork-upgrade`
skill'i ve diğer yükseltme sonrası smoke araçları için uygun, makine tarafından okunabilir
bir zarf (`{ probesRun, findings }`) almak üzere `--json` ekleyin. Kurulu Plugin dizini
eksik veya hatalı biçimlendirilmişse JSON modu yine bu zarfı bir `plugin.index_unavailable`
hata bulgusuyla üretir.

Notlar:

- Nix modunda (`OPENCLAW_NIX_MODE=1`), salt okunur doctor denetimleri çalışmaya devam eder, ancak `openclaw.json` değiştirilemez olduğu için `doctor --fix`, `doctor --repair`, `doctor --yes` ve `doctor --generate-gateway-token` devre dışıdır. Bunun yerine bu kurulumun Nix kaynağını düzenleyin; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.
- Etkileşimli istemler (keychain/OAuth düzeltmeleri gibi) yalnızca stdin bir TTY olduğunda ve `--non-interactive` **ayarlanmamışsa** çalışır. Headless çalıştırmalar (Cron, Telegram, terminal yok) istemleri atlar.
- Performans: etkileşimsiz `doctor` çalıştırmaları, headless sağlık denetimlerinin hızlı kalması için istekli Plugin yüklemeyi atlar. Etkileşimli doctor oturumları, eski sağlık ve onarım akışının ihtiyaç duyduğu Plugin yüzeylerini yine de yükler.
- `--lint`, `--non-interactive` seçeneğinden daha katıdır: her zaman salt okunurdur, asla istem göstermez ve asla güvenli migration’ları uygulamaz. Doctor’ın değişiklik yapmasını istediğinizde `doctor --fix` veya `doctor --repair` çalıştırın.
- Varsayılan olarak doctor, gizli bilgileri denetlerken `exec` SecretRef’lerini yürütmez. `openclaw doctor --allow-exec` veya `openclaw doctor --lint --allow-exec` komutlarını yalnızca doctor’ın yapılandırılmış bu gizli bilgi çözücülerini çalıştırmasını özellikle istediğinizde kullanın.
- `--fix` (`--repair` için alias), `~/.openclaw/openclaw.json.bak` konumuna bir yedek yazar ve bilinmeyen yapılandırma anahtarlarını kaldırıp her kaldırmayı listeler.
- Modernleştirilmiş sağlık denetimleri `doctor --fix` için bir `repair()` yolu sunabilir; bunu sunmayan denetimler mevcut doctor onarım akışı üzerinden devam eder.
- `doctor --fix --non-interactive`, eksik veya eski Gateway servis tanımlarını bildirir ancak update onarım modu dışında bunları kurmaz veya yeniden yazmaz. Eksik bir servis için `openclaw gateway install` çalıştırın ya da launcher’ı özellikle değiştirmek istediğinizde `openclaw gateway install --force` kullanın.
- Durum bütünlüğü denetimleri artık sessions dizinindeki yetim transcript dosyalarını algılar. Bunları `.deleted.<timestamp>` olarak arşivlemek etkileşimli onay gerektirir; `--fix`, `--yes` ve headless çalıştırmalar onları yerinde bırakır.
- Doctor ayrıca eski Cron job biçimleri için `~/.openclaw/cron/jobs.json` (veya `cron.store`) dosyasını tarar ve kanonik satırları SQLite’a içe aktarmadan önce bunları yeniden yazar.
- Doctor, açık `payload.model` override’ları olan Cron job’ları; sağlayıcı namespace sayıları ve `agents.defaults.model` ile uyuşmazlıklar dahil bildirir. Böylece varsayılan modeli devralmayan zamanlanmış işler auth veya faturalandırma incelemeleri sırasında görünür olur.
- Linux’ta doctor, kullanıcının crontab’ı hâlâ eski `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çalıştırıyorsa uyarır; bu betik artık bakımlı değildir ve Cron systemd user-bus ortamına sahip olmadığında yanlış WhatsApp Gateway kesinti günlükleri üretebilir.
- WhatsApp etkin olduğunda doctor, yerel `openclaw-tui` istemcileri hâlâ çalışırken bozulmuş bir Gateway event loop olup olmadığını denetler. `doctor --fix`, WhatsApp yanıtlarının eski TUI yenileme döngülerinin arkasında kuyruğa alınmaması için yalnızca doğrulanmış yerel TUI istemcilerini durdurur.
- Doctor; birincil modeller, fallback’ler, görsel/video üretim modelleri, Heartbeat/subagent/Compaction override’ları, hook’lar, kanal model override’ları ve eski session route pin’leri genelindeki eski `openai-codex/*` model ref’lerini kanonik `openai/*` ref’lerine yeniden yazar. `--fix` ayrıca eski `openai-codex:*` auth profillerini ve `auth.order.openai-codex` girdilerini `openai:*` biçimine taşır, Codex niyetini sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` girdilerine aktarır, eski tüm-agent/session runtime pin’lerini kaldırır ve onarılmış OpenAI agent ref’lerini doğrudan OpenAI API-key auth yerine Codex auth routing üzerinde tutar.
- Doctor, eski OpenClaw sürümleri tarafından oluşturulan eski Plugin bağımlılık staging durumunu temizler ve bunu peer dependency olarak bildiren yönetilen npm Plugin’leri için host `openclaw` paketini yeniden link’ler. Ayrıca `plugins.entries`, yapılandırılmış kanallar, yapılandırılmış sağlayıcı/arama ayarları veya yapılandırılmış agent runtime’ları gibi yapılandırma tarafından referans verilen eksik indirilebilir Plugin’leri onarır. Paket güncellemeleri sırasında doctor, paket değişimi tamamlanana kadar package-manager Plugin onarımını atlar; yapılandırılmış bir Plugin hâlâ kurtarma gerektiriyorsa daha sonra `openclaw doctor --fix` komutunu yeniden çalıştırın. İndirme başarısız olursa doctor kurulum hatasını bildirir ve sonraki onarım denemesi için yapılandırılmış Plugin girdisini korur.
- Doctor, Plugin keşfi sağlıklı olduğunda `plugins.allow`/`plugins.deny`/`plugins.entries` içinden eksik Plugin id’lerini, ayrıca eşleşen boşa düşmüş kanal yapılandırmasını, Heartbeat hedeflerini ve kanal model override’larını kaldırarak eski Plugin yapılandırmasını onarır.
- Doctor, etkilenen `plugins.entries.<id>` girdisini devre dışı bırakıp geçersiz `config` payload’unu kaldırarak geçersiz Plugin yapılandırmasını karantinaya alır. Gateway başlatma zaten yalnızca bu bozuk Plugin’i atlar, böylece diğer Plugin’ler ve kanallar çalışmaya devam edebilir.
- Gateway yaşam döngüsüne başka bir supervisor sahip olduğunda `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın. Doctor Gateway/servis sağlığını yine de bildirir ve servis dışı onarımları uygular, ancak servis kurulumunu/başlatmasını/yeniden başlatmasını/bootstrap işlemini ve eski servis temizliğini atlar.
- Linux’ta doctor, etkin olmayan ekstra Gateway benzeri systemd unit’lerini yok sayar ve onarım sırasında çalışan bir systemd Gateway servisi için komut/entrypoint metadata’sını yeniden yazmaz. Etkin launcher’ı özellikle değiştirmek istediğinizde önce servisi durdurun veya `openclaw gateway install --force` kullanın.
- Doctor, eski düz Talk yapılandırmasını (`talk.voiceId`, `talk.modelId` ve benzerleri) otomatik olarak `talk.provider` + `talk.providers.<provider>` biçimine taşır.
- Yalnızca nesne anahtarı sırası farklı olduğunda tekrarlanan `doctor --fix` çalıştırmaları artık Talk normalleştirmesini bildirmez/uygulamaz.
- Doctor bir bellek araması hazırlık denetimi içerir ve embedding kimlik bilgileri eksik olduğunda `openclaw configure --section model` önerebilir.
- Doctor, yapılandırılmış komut sahibi olmadığında uyarır. Komut sahibi, yalnızca owner komutlarını çalıştırmaya ve tehlikeli eylemleri onaylamaya izin verilen insan operatör hesabıdır. DM eşleştirmesi yalnızca birinin botla konuşmasına izin verir; ilk owner bootstrap var olmadan önce bir göndereni onayladıysanız `commands.ownerAllowFrom` değerini açıkça ayarlayın.
- Doctor, Codex modu agent’lar yapılandırıldığında ve operatörün Codex home dizininde kişisel Codex CLI varlıkları bulunduğunda bir bilgi notu bildirir. Yerel Codex app-server başlatmaları izole agent başına home dizinleri kullanır; bu nedenle gerekiyorsa önce Codex Plugin’ini kurun, ardından bilinçli olarak yükseltilmesi gereken varlıkların envanterini çıkarmak için `openclaw migrate plan codex` kullanın.
- Doctor, emekli edilmiş `plugins.entries.codex.config.codexDynamicToolsProfile` değerini kaldırır; Codex app-server, Codex’e özgü workspace araçlarını her zaman native tutar.
- Doctor, varsayılan agent için izin verilen Skills mevcut runtime ortamında bin’ler, env var’lar, yapılandırma veya OS gereksinimleri eksik olduğu için kullanılamadığında uyarır. `doctor --fix`, kullanılamayan bu skills’i `skills.entries.<skill>.enabled=false` ile devre dışı bırakabilir; skill’i etkin tutmak istediğinizde bunun yerine eksik gereksinimi kurun/yapılandırın.
- Sandbox modu etkin ancak Docker kullanılamıyorsa doctor, düzeltme önerisiyle (`install Docker` veya `openclaw config set agents.defaults.sandbox.mode off`) yüksek sinyalli bir uyarı bildirir.
- Eski sandbox registry dosyaları veya shard dizinleri mevcutsa (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` veya `~/.openclaw/sandbox/browsers/`), doctor bunları bildirir; `openclaw doctor --fix` geçerli girdileri SQLite’a taşır ve geçersiz eski dosyaları karantinaya alır.
- `gateway.auth.token`/`gateway.auth.password` SecretRef tarafından yönetiliyor ve mevcut komut yolunda kullanılamıyorsa doctor salt okunur bir uyarı bildirir ve düz metin fallback kimlik bilgileri yazmaz. Exec destekli SecretRef’ler için doctor, `--allow-exec` yoksa yürütmeyi atlar.
- Bir fix yolunda kanal SecretRef incelemesi başarısız olursa doctor erken çıkmak yerine devam eder ve bir uyarı bildirir.
- Durum dizini migration’larından sonra doctor, etkin varsayılan Telegram veya Discord hesapları env fallback’e bağlı olduğunda ve `TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN` doctor işleminde kullanılamadığında uyarır.
- Telegram `allowFrom` kullanıcı adı otomatik çözümlemesi (`doctor --fix`), mevcut komut yolunda çözümlenebilir bir Telegram token gerektirir. Token incelemesi kullanılamıyorsa doctor bir uyarı bildirir ve o geçiş için otomatik çözümlemeyi atlar.

## macOS: `launchctl` env override’ları

Daha önce `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (veya `...PASSWORD`) çalıştırdıysanız, bu değer yapılandırma dosyanızı override eder ve kalıcı "unauthorized" hatalarına neden olabilir.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway doctor](/tr/gateway/doctor)
