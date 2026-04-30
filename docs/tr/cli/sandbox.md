---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Korumalı alan çalışma zamanlarını yönetin ve geçerli korumalı alan ilkesini inceleyin
title: Korumalı Alan CLI
x-i18n:
    generated_at: "2026-04-30T09:14:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Yalıtılmış ajan yürütmesi için sandbox çalışma zamanlarını yönetin.

## Genel Bakış

OpenClaw, güvenlik için ajanları yalıtılmış sandbox çalışma zamanlarında çalıştırabilir. `sandbox` komutları, güncellemelerden veya yapılandırma değişikliklerinden sonra bu çalışma zamanlarını incelemenize ve yeniden oluşturmanıza yardımcı olur.

Bugün bu genellikle şu anlama gelir:

- Docker sandbox container'ları
- `agents.defaults.sandbox.backend = "ssh"` olduğunda SSH sandbox çalışma zamanları
- `agents.defaults.sandbox.backend = "openshell"` olduğunda OpenShell sandbox çalışma zamanları

`ssh` ve OpenShell `remote` için yeniden oluşturma, Docker'a göre daha önemlidir:

- uzak çalışma alanı, ilk tohumlamadan sonra kanonik kaynaktır
- `openclaw sandbox recreate`, seçili kapsam için bu kanonik uzak çalışma alanını siler
- sonraki kullanım, mevcut yerel çalışma alanından yeniden tohumlar

## Komutlar

### `openclaw sandbox explain`

**Etkin** sandbox modunu/kapsamını/çalışma alanı erişimini, sandbox araç politikasını ve yükseltilmiş kapıları inceleyin (düzeltme yapılandırma anahtarı yollarıyla birlikte).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Tüm sandbox çalışma zamanlarını durumları ve yapılandırmalarıyla listeleyin.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Çıktı şunları içerir:**

- Çalışma zamanı adı ve durumu
- Arka uç (`docker`, `openshell` vb.)
- Yapılandırma etiketi ve geçerli yapılandırmayla eşleşip eşleşmediği
- Yaş (oluşturulmasından bu yana geçen süre)
- Boşta kalma süresi (son kullanımdan bu yana geçen süre)
- İlişkili oturum/ajan

### `openclaw sandbox recreate`

Güncellenmiş yapılandırmayla yeniden oluşturmayı zorlamak için sandbox çalışma zamanlarını kaldırın.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Seçenekler:**

- `--all`: Tüm sandbox container'larını yeniden oluştur
- `--session <key>`: Belirli oturum için container'ı yeniden oluştur
- `--agent <id>`: Belirli ajan için container'ları yeniden oluştur
- `--browser`: Yalnızca tarayıcı container'larını yeniden oluştur
- `--force`: Onay istemini atla

<Note>
Çalışma zamanları, ajan bir sonraki kez kullanıldığında otomatik olarak yeniden oluşturulur.
</Note>

## Kullanım durumları

### Bir Docker imajını güncelledikten sonra

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Sandbox yapılandırmasını değiştirdikten sonra

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### SSH hedefini veya SSH kimlik doğrulama materyalini değiştirdikten sonra

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Temel `ssh` arka ucu için yeniden oluşturma, SSH hedefindeki kapsam başına uzak çalışma alanı kökünü siler. Bir sonraki çalıştırma, bunu yerel çalışma alanından yeniden tohumlar.

### OpenShell kaynağını, politikasını veya modunu değiştirdikten sonra

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` modu için yeniden oluşturma, o kapsamın kanonik uzak çalışma alanını siler. Bir sonraki çalıştırma, bunu yerel çalışma alanından yeniden tohumlar.

### setupCommand değiştirildikten sonra

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Yalnızca belirli bir ajan için

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Bu neden gereklidir

Sandbox yapılandırmasını güncellediğinizde:

- Mevcut çalışma zamanları eski ayarlarla çalışmaya devam eder.
- Çalışma zamanları yalnızca 24 saatlik hareketsizlikten sonra temizlenir.
- Düzenli kullanılan ajanlar eski çalışma zamanlarını süresiz olarak canlı tutar.

Eski çalışma zamanlarının kaldırılmasını zorlamak için `openclaw sandbox recreate` kullanın. Bunlar, bir sonraki ihtiyaç duyulduğunda geçerli ayarlarla otomatik olarak yeniden oluşturulur.

<Tip>
Elle arka uca özgü temizlik yapmak yerine `openclaw sandbox recreate` tercih edin. Gateway'in çalışma zamanı kayıt defterini kullanır ve kapsam veya oturum anahtarları değiştiğinde uyumsuzluklardan kaçınır.
</Tip>

## Yapılandırma

Sandbox ayarları, `agents.defaults.sandbox` altında `~/.openclaw/openclaw.json` içinde bulunur (ajan başına geçersiz kılmalar `agents.list[].sandbox` içine gider):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Sandboxing](/tr/gateway/sandboxing)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Doctor](/tr/gateway/doctor): sandbox kurulumunu denetler.
