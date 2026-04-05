---
read_when:
    - CLI üzerinden exec onaylarını düzenlemek istiyorsunuz
    - Gateway veya node ana bilgisayarlarında allowlist yönetmeniz gerekiyor
summary: '`openclaw approvals` için CLI referansı (gateway veya node ana bilgisayarları için exec onayları)'
title: approvals
x-i18n:
    generated_at: "2026-04-05T13:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

**Yerel ana bilgisayar**, **gateway ana bilgisayarı** veya bir **node ana bilgisayarı** için exec onaylarını yönetin.
Varsayılan olarak komutlar disk üzerindeki yerel onaylar dosyasını hedefler. Gateway'i hedeflemek için `--gateway`, belirli bir node'u hedeflemek için `--node` kullanın.

Takma ad: `openclaw exec-approvals`

İlgili:

- Exec onayları: [Exec approvals](/tools/exec-approvals)
- Node'lar: [Nodes](/nodes)

## Yaygın komutlar

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` artık yerel, gateway ve node hedefleri için etkili exec ilkesini gösterir:

- istenen `tools.exec` ilkesi
- ana bilgisayar approvals-file ilkesi
- öncelik kuralları uygulandıktan sonraki etkili sonuç

Önceliklendirme bilinçli olarak böyledir:

- ana bilgisayar approvals dosyası uygulanabilir doğruluk kaynağıdır
- istenen `tools.exec` ilkesi niyeti daraltabilir veya genişletebilir, ancak etkili sonuç yine de ana bilgisayar kurallarından türetilir
- `--node`, node ana bilgisayarı approvals dosyasını gateway `tools.exec` ilkesiyle birleştirir, çünkü çalışma zamanında her ikisi de geçerlidir
- gateway yapılandırması kullanılamıyorsa, CLI node approvals anlık görüntüsüne geri döner ve son çalışma zamanı ilkesinin hesaplanamadığını belirtir

## Bir dosyadan onayları değiştirin

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`, yalnızca katı JSON değil JSON5 kabul eder. `--file` veya `--stdin` kullanın, ikisini birden değil.

## "Asla sorma" / YOLO örneği

Exec onaylarında asla durmaması gereken bir ana bilgisayar için, ana bilgisayar approvals varsayılanlarını `full` + `off` olarak ayarlayın:

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

Node varyantı:

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

Bu yalnızca **ana bilgisayar approvals dosyasını** değiştirir. İstenen OpenClaw ilkesini de hizalı tutmak için şunları da ayarlayın:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Bu örnekte neden `tools.exec.host=gateway` kullanılıyor:

- `host=auto` hâlâ "varsa sandbox, yoksa gateway" anlamına gelir.
- YOLO yönlendirmeyle değil, onaylarla ilgilidir.
- Bir sandbox yapılandırılmış olsa bile ana bilgisayar exec kullanmak istiyorsanız, ana bilgisayar seçimini `gateway` veya `/exec host=gateway` ile açıkça belirtin.

Bu, mevcut ana bilgisayar varsayılanlı YOLO davranışıyla eşleşir. Onaylar istiyorsanız bunu sıkılaştırın.

## Allowlist yardımcıları

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
- paylaşılan node RPC seçenekleri: `--url`, `--token`, `--timeout`, `--json`

Hedefleme notları:

- hedef bayrağı yoksa disk üzerindeki yerel approvals dosyası kullanılır
- `--gateway`, gateway ana bilgisayarı approvals dosyasını hedefler
- `--node`, kimlik, ad, IP veya kimlik öneki çözümlemesinden sonra bir node ana bilgisayarını hedefler

`allowlist add|remove` ayrıca şunu da destekler:

- `--agent <id>` (varsayılan: `*`)

## Notlar

- `--node`, `openclaw nodes` ile aynı çözümleyiciyi kullanır (kimlik, ad, ip veya kimlik öneki).
- `--agent` varsayılan olarak `"*"` değerini kullanır; bu tüm ajanlara uygulanır.
- Node ana bilgisayarı `system.execApprovals.get/set` desteğini duyurmalıdır (macOS uygulaması veya headless node ana bilgisayarı).
- Approvals dosyaları ana bilgisayar başına `~/.openclaw/exec-approvals.json` içinde saklanır.
