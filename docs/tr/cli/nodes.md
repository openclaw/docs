---
read_when:
    - Eşleştirilmiş Node'ları yönetiyorsunuz (kameralar, ekran, tuval)
    - İstekleri onaylamanız veya node komutlarını çağırmanız gerekir
summary: '`openclaw nodes` için CLI referansı (durum, eşleştirme, çağırma, kamera/tuval/ekran/konum/bildirim)'
title: Node'lar
x-i18n:
    generated_at: "2026-07-16T16:50:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Eşleştirilmiş Node'ları (cihazları) yönetin ve Node yeteneklerini çağırın.

İlgili: [Node'lara genel bakış](/tr/nodes) - [Etkin bilgisayar varlığı](/nodes/presence) - [Kamera Node'ları](/tr/nodes/camera) - [Görüntü Node'ları](/tr/nodes/images)

Her alt komuttaki ortak seçenekler: `--url <url>`, `--token <token>`, `--timeout <ms>` (varsayılan `10000`), `--json`.

## Durum

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` ve `list` komutlarının ikisi de `--connected` (yalnızca bağlı Node'lar) ve `--last-connected <duration>` (ör. `24h`, `7d`; yalnızca belirtilen süre içinde bağlanmış Node'lar) seçeneklerini kabul eder. `list`, bekleyen ve eşleştirilmiş Node'ları ayrı tablolarda gösterir; eşleştirilmiş satırlar en son bağlantı yaşını (Last Connect) içerir. `status`, Node başına yetenek, sürüm ve son giriş ayrıntılarını tek bir birleştirilmiş tabloda gösterir. Bağlı bir macOS Node'u, son girişi yalnızca Erişilebilirlik izni verilmişken bildirir ve en güncel satır `active` olarak işaretlenir; bkz. [Etkin bilgisayar varlığı](/nodes/presence). `describe`, bir Node'un yeteneklerini, izinlerini, etkinliğini ve geçerli/bekleyen çağırma komutlarını yazdırır.

## Eşleştirme

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Bu komutlar, Node'un WS `connect` el sıkışmasını denetleyen cihaz eşleştirmesinden (`openclaw devices approve`) ayrı olan, Gateway'in sahip olduğu `node.pair.*` deposunu yönetir. İkisinin nasıl ilişkili olduğu hakkında bilgi için [Node'lar](/tr/nodes) bölümüne bakın.

- `remove`, Node'un eşleştirilmiş rol girdisini iptal eder. Cihaz destekli bir Node için bu işlem, cihaz eşleştirme deposundaki `node` rolünü iptal eder ve Node rolü oturumlarının bağlantısını keser: karma rollü bir cihaz satırını korur ve yalnızca `node` rolünü kaybeder; yalnızca Node rolüne sahip bir cihaz satırı silinir. Ayrıca Gateway'in sahip olduğu eşleşen tüm eski Node eşleştirme kayıtlarını temizler.
- `pending` yalnızca `operator.pairing` kapsamını gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, açıkça güvenilen ve ilk kez gerçekleştirilen `role: node` cihaz eşleştirmesinde bekleme adımını atlayabilir. Varsayılan olarak kapalıdır; rol yükseltmelerini onaylamaz.
- `gateway.nodes.pairing.sshVerify` (varsayılan olarak açık), Gateway cihaz anahtarını Node ana makinesine SSH üzerinden doğrulayabildiğinde ilk kez gerçekleştirilen `role: node` cihaz eşleştirmesini otomatik olarak onaylar; ilk yetenek yüzeyi de aynı adımda onaylanır. Bkz. [Node eşleştirme](/tr/gateway/pairing#ssh-verified-device-auto-approval-default).
- `approve` kapsam gereksinimleri, bekleyen isteğin bildirdiği komutlara göre belirlenir:
  - komutsuz istek: `operator.pairing`
  - normal Node komutları: `operator.pairing` + `operator.write`
  - yönetici açısından hassas komutlar (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` ve `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- `remove` kapsamı: `operator.pairing`, operatör olmayan Node satırlarını kaldırabilir; karma rollü bir cihazdaki kendi Node rolünü iptal eden cihaz belirteci çağırıcısı ayrıca `operator.admin` gerektirir.

## Çağırma

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Bayraklar:

- `--command <command>` (zorunlu): ör. `canvas.eval`.
- `--params <json>`: JSON nesnesi dizesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: Node çağırma zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı eşgüçlülük anahtarı.

`system.run` ve `system.run.prepare` burada engellenir; kabuk yürütme için bunun yerine `host=node` ile `exec` aracını kullanın. `system.which` işlemine `invoke` üzerinden izin verilir.

## Bildirim, anında iletme, konum, ekran

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify`, macOS, iOS, Android ve doğrudan watchOS Node'ları dâhil olmak üzere `system.notify` bildiren bir Node'a yerel bildirim gönderir. Doğrudan watchOS teslimatı, OpenClaw'ın etkin olmasını gerektirir. `--title` veya `--body` gerektirir. Seçenekler: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (varsayılan `system`), `--invoke-timeout <ms>` (varsayılan `15000`).
- `push`, bir iOS Node'una APNs test anında iletimi gönderir. Seçenekler: `--title <text>` (varsayılan `OpenClaw`), algılanan APNs ortamını geçersiz kılmak için `--body <text>`, `--environment <sandbox|production>`.
- `location get`, Node'un geçerli konumunu getirir. Seçenekler: `--max-age <ms>` (önbelleğe alınmış bir konum tespitini yeniden kullan), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (varsayılan `10000`), `--invoke-timeout <ms>` (varsayılan `20000`).
- `screen record`, kısa bir klip yakalar ve kaydedilen yolu yazdırır (veya `--json` ile JSON yazar). Seçenekler: `--screen <index>` (varsayılan `0`), `--duration <ms|10s>` (varsayılan `10000`), `--fps <fps>` (varsayılan `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (varsayılan `120000`).

Kamera ve Canvas komutlarının kendi belgeleri vardır: [Kamera Node'ları](/tr/nodes/camera), [Canvas](/tr/platforms/mac/canvas). Canvas, paketle birlikte sunulan deneysel Canvas Plugin'i tarafından uygulanır; çekirdek, `openclaw nodes canvas` öğesini uyumluluk bağlama noktası olarak tutar.

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
