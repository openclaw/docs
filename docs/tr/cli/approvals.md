---
read_when:
    - Yürütme onaylarını CLI üzerinden düzenlemek istiyorsunuz
    - Gateway veya Node ana makinelerindeki izin listelerini yönetmeniz gerekir
summary: '`openclaw approvals` ve `openclaw exec-policy` için CLI başvurusu'
title: Onaylar
x-i18n:
    generated_at: "2026-07-12T11:33:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**Yerel ana makine**, **Gateway ana makinesi** veya bir **Node ana makinesi** için çalıştırma onaylarını yönetin. Hedef bayrağı belirtilmediğinde komutlar, diskteki yerel onay dosyasını okur/yazar. Gateway'i hedeflemek için `--gateway`, belirli bir Node'u hedeflemek için `--node <id|name|ip>` kullanın.

Takma ad: `openclaw exec-approvals`

İlgili: [Çalıştırma onayları](/tr/tools/exec-approvals), [Node'lar](/tr/nodes)

## `openclaw exec-policy`

`openclaw exec-policy`, istenen `tools.exec.*` yapılandırmasıyla yerel ana makine onay dosyasını tek adımda eşitlenmiş durumda tutan, **yalnızca yerelde** çalışan kolaylık komutudur:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Ön ayarlar (`yolo`, `cautious`, `deny-all`) `host`, `security`, `ask` ve `askFallback` ayarlarını birlikte uygular. `set` yalnızca ilettiğiniz bayrakları uygular; kabul edilen her değer doğrulanır (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Kapsam:

- Yerel yapılandırma dosyasını ve yerel onay dosyasını birlikte günceller; politikayı Gateway'e veya bir Node ana makinesine göndermez.
- `--host node` reddedilir: Node çalıştırma onayları çalışma zamanında Node'dan alınır; bu nedenle yerel `exec-policy` bunları eşitleyemez. Bunun yerine `openclaw approvals set --node <id|name|ip>` kullanın.
- `exec-policy show`, yerel onay dosyasından etkin bir politika türetmek yerine `host=node` kapsamlarını çalışma zamanında Node tarafından yönetiliyor olarak işaretler.

Uzak ana makine onayları için doğrudan `openclaw approvals set --gateway` veya `openclaw approvals set --node <id|name|ip>` kullanın.

## Yaygın komutlar

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get`, hedefin etkin çalıştırma politikasını gösterir: istenen `tools.exec` politikası, ana makinenin onay dosyası politikası ve birleştirilmiş etkin sonuç. Windows yardımcı uygulaması gibi ana makineye özgü bir politikası olan Node'lar, OpenClaw onay dosyası politika hesaplamasını uygulamak yerine bu politikayı doğrudan gösterir.

Dosya destekli Node'larda birleştirilmiş görünüm, ana makine tarafından çözümlenmiş bir politika anlık görüntüsü gerektirir. Eski Node'lar, Gateway'in istenen politikasının ana makinede de geçerli olduğunu varsaymak yerine etkin politikayı kullanılamıyor olarak gösterir.

<Note>
Oturum başına `/exec` geçersiz kılmaları dahil edilmez. Geçerli varsayılanlarını incelemek için ilgili oturumda `/exec` çalıştırın.
</Note>

Öncelik sırası:

- Ana makine onay dosyası, uygulanabilir tek doğruluk kaynağıdır.
- İstenen `tools.exec` politikası amacı daraltabilir veya genişletebilir; ancak etkin sonuç ana makine kurallarından türetilir.
- `--node`, Node ana makinesinin onay dosyasını Gateway `tools.exec` politikasıyla birleştirir (çalışma zamanında ikisi de uygulanır).
- Gateway yapılandırması kullanılamıyorsa CLI, Node onayları anlık görüntüsüne geri döner ve nihai çalışma zamanı politikasının hesaplanamadığını belirtir.

## Onayları bir dosyadan değiştirme

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`, yalnızca katı JSON'u değil JSON5'i de kabul eder. `--file` veya `--stdin` seçeneklerinden birini kullanın; ikisini birlikte kullanmayın.

Ana makineye özgü Windows Node'ları kendi politika biçimlerini kullanır:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI önce Node'un geçerli karmasını okur ve güncellemeyle birlikte gönderir; böylece eş zamanlı yerel düzenlemelerin üzerine yazılmak yerine güncelleme reddedilir. Bu işlem Node'un tüm kural listesini değiştirdiği için `rules` zorunludur; `defaultAction` isteğe bağlıdır. Yerel politikasının devre dışı olduğunu bildiren bir Node uzaktan yapılandırılamaz; önce o ana makinedeki politikayı etkinleştirin veya yapılandırın. Ana makineye özgü politikalar `allowlist add|remove` yardımcılarını desteklemez.

## "Asla sorma" / YOLO örneği

Çalıştırma onaylarında hiçbir zaman durmaması gereken bir ana makine için ana makine onaylarının varsayılanlarını `full` + `off` olarak ayarlayın:

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

OpenClaw onay dosyası sunan Node'lar için aynı gövdeyi `openclaw approvals set --node <id|name|ip> --stdin` ile kullanın. Ana makineye özgü Node'lar, yukarıda gösterilen sahiplerine özgü biçimi gerektirir.

Bu yalnızca **ana makine onay dosyasını** değiştirir. İstenen OpenClaw politikasını uyumlu tutmak için ayrıca şunları ayarlayın:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` burada açıkça belirtilmiştir; çünkü `host=auto` hâlâ "varsa sandbox, aksi takdirde Gateway" anlamına gelir: YOLO yönlendirmeyle değil, onaylarla ilgilidir. Yapılandırılmış bir sandbox olsa bile ana makinede çalıştırma istediğinizde `gateway` (veya `/exec host=gateway`) kullanın.

Belirtilmeyen `askFallback` varsayılan olarak `deny` değerini alır. Asla sormama davranışını koruması gereken, kullanıcı arayüzü olmayan bir ana makineyi yükseltirken `askFallback: "full"` değerini açıkça ayarlayın.

Yalnızca yerel makinede aynı amaç için yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

## İzin listesi yardımcıları

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Yaygın seçenekler

`get`, `set` ve `allowlist add|remove` seçeneklerinin tümü şunları destekler:

- `--node <id|name|ip>` (kimliği, adı, IP'yi veya kimlik önekini çözümler; `openclaw nodes` ile aynı çözümleyiciyi kullanır)
- `--gateway`
- paylaşılan Node RPC seçenekleri: `--url`, `--token`, `--timeout`, `--json`

Hedef bayrağının belirtilmemesi, diskteki yerel onay dosyasının kullanılacağı anlamına gelir.

`allowlist add|remove` ayrıca `--agent <id>` seçeneğini destekler (varsayılanı `"*"` değeridir ve tüm aracılara uygulanır).

## Notlar

- Node ana makinesi `system.execApprovals.get/set` desteğini duyurmalıdır (macOS uygulaması, başsız Node ana makinesi veya Windows yardımcı uygulaması).
- Onay dosyaları, OpenClaw durum dizininde her ana makine için ayrı saklanır: `$OPENCLAW_STATE_DIR/exec-approvals.json`; değişken ayarlanmamışsa `~/.openclaw/exec-approvals.json`.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Çalıştırma onayları](/tr/tools/exec-approvals)
