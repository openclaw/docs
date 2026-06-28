---
read_when:
    - Exec onaylarını CLI'dan düzenlemek istiyorsunuz
    - Gateway veya node ana makinelerinde allowlist'leri yönetmeniz gerekir
summary: '`openclaw approvals` ve `openclaw exec-policy` için CLI referansı'
title: Onaylar
x-i18n:
    generated_at: "2026-06-28T00:20:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**Yerel ana makine**, **Gateway ana makinesi** veya bir **düğüm ana makinesi** için exec onaylarını yönetin.
Varsayılan olarak komutlar diskteki yerel onaylar dosyasını hedefler. Gateway'i hedeflemek için `--gateway` kullanın veya belirli bir düğümü hedeflemek için `--node` kullanın.

Takma ad: `openclaw exec-approvals`

İlgili:

- Exec onayları: [Exec onayları](/tr/tools/exec-approvals)
- Node'lar: [Node'lar](/tr/nodes)

## `openclaw exec-policy`

`openclaw exec-policy`, istenen `tools.exec.*` yapılandırmasını ve yerel ana makine onayları dosyasını tek adımda uyumlu tutmak için yerel kolaylık komutudur.

Şunları yapmak istediğinizde kullanın:

- yerel istenen ilkeyi, ana makine onayları dosyasını ve etkili birleştirmeyi incelemek
- YOLO veya tümünü reddet gibi yerel bir ön ayar uygulamak
- yerel `tools.exec.*` ile yerel ana makine onayları dosyasını eşitlemek

Örnekler:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Çıktı modları:

- `--json` yok: insan tarafından okunabilir tablo görünümünü yazdırır
- `--json`: makine tarafından okunabilir yapılandırılmış çıktı yazdırır

Geçerli kapsam:

- `exec-policy` **yalnızca yereldir**
- yerel yapılandırma dosyasını ve yerel onaylar dosyasını birlikte günceller
- ilkeyi Gateway ana makinesine veya bir düğüm ana makinesine göndermez
- düğüm exec onayları çalışma zamanında düğümden alındığı ve bunun yerine düğüm hedefli onay komutları üzerinden yönetilmesi gerektiği için bu komutta `--host node` reddedilir
- `openclaw exec-policy show`, `host=node` kapsamlarını yerel onaylar dosyasından etkili bir ilke türetmek yerine çalışma zamanında düğüm tarafından yönetilen kapsamlar olarak işaretler

Uzak ana makine onaylarını doğrudan düzenlemeniz gerekiyorsa `openclaw approvals set --gateway`
veya `openclaw approvals set --node <id|name|ip>` kullanmaya devam edin.

## Yaygın komutlar

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` artık yerel, Gateway ve düğüm hedefleri için etkili exec ilkesini gösterir:

- istenen `tools.exec` ilkesi
- ana makine onaylar dosyası ilkesi
- öncelik kuralları uygulandıktan sonraki etkili sonuç

Öncelik kasıtlıdır:

- ana makine onayları dosyası uygulanabilir doğruluk kaynağıdır
- istenen `tools.exec` ilkesi amacı daraltabilir veya genişletebilir, ancak etkili sonuç yine de ana makine kurallarından türetilir
- `--node`, düğüm ana makinesi onayları dosyasını Gateway `tools.exec` ilkesiyle birleştirir, çünkü çalışma zamanında ikisi de hâlâ geçerlidir
- Gateway yapılandırması kullanılamıyorsa CLI, düğüm onayları anlık görüntüsüne geri döner ve nihai çalışma zamanı ilkesinin hesaplanamadığını belirtir

## Onayları bir dosyadan değiştir

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` yalnızca katı JSON değil, JSON5 kabul eder. İkisini birden değil, `--file` veya `--stdin` seçeneklerinden birini kullanın.

## "Asla sorma" / YOLO örneği

Exec onaylarında asla durmaması gereken bir ana makine için ana makine onayları varsayılanlarını `full` + `off` olarak ayarlayın:

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

Düğüm varyantı:

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

Bu yalnızca **ana makine onayları dosyasını** değiştirir. İstenen OpenClaw ilkesini de uyumlu tutmak için ayrıca şunları ayarlayın:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Bu örnekte neden `tools.exec.host=gateway`:

- `host=auto` hâlâ "kullanılabiliyorsa sandbox, aksi halde Gateway" anlamına gelir.
- YOLO yönlendirmeyle değil, onaylarla ilgilidir.
- Bir sandbox yapılandırılmış olsa bile ana makine exec istiyorsanız ana makine seçimini `gateway` veya `/exec host=gateway` ile açık hâle getirin.

Atlanan `askFallback` varsayılan olarak `deny` olur. Asla sormama davranışını koruması gereken kullanıcı arayüzü olmayan bir ana makineyi yükseltirken `askFallback: "full"` değerini açıkça ayarlayın.

Yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol, hem istenen yerel `tools.exec.*` yapılandırmasını hem de yerel onay varsayılanlarını birlikte günceller. Amaç olarak yukarıdaki manuel iki adımlı kuruluma eşdeğerdir, ancak yalnızca yerel makine içindir.

## İzin listesi yardımcıları

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Yaygın seçenekler

`get`, `set` ve `allowlist add|remove` şunların tümünü destekler:

- `--node <id|name|ip>`
- `--gateway`
- paylaşılan düğüm RPC seçenekleri: `--url`, `--token`, `--timeout`, `--json`

Hedefleme notları:

- hedef bayrağı yoksa diskteki yerel onaylar dosyası kullanılır
- `--gateway`, Gateway ana makinesi onayları dosyasını hedefler
- `--node`, kimlik, ad, IP veya kimlik öneki çözümlendikten sonra bir düğüm ana makinesini hedefler

`allowlist add|remove` ayrıca şunu destekler:

- `--agent <id>` (varsayılanı `*`)

## Notlar

- `--node`, `openclaw nodes` ile aynı çözümleyiciyi kullanır (kimlik, ad, IP veya kimlik öneki).
- `--agent` varsayılan olarak `"*"` olur; bu, tüm aracılara uygulanır.
- Düğüm ana makinesi `system.execApprovals.get/set` özelliğini duyurmalıdır (macOS uygulaması veya başsız düğüm ana makinesi).
- Onay dosyaları OpenClaw durum dizininde her ana makine için ayrı depolanır
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, veya
  değişken ayarlı olmadığında `~/.openclaw/exec-approvals.json`).

## İlgili

- [CLI başvurusu](/tr/cli)
- [Exec onayları](/tr/tools/exec-approvals)
