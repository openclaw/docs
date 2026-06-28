---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Korumalı alan çalışma zamanlarını yönetin ve geçerli korumalı alan ilkesini inceleyin
title: Korumalı Alan CLI
x-i18n:
    generated_at: "2026-06-28T00:24:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Yalıtılmış agent yürütmesi için sandbox çalışma zamanlarını yönetin.

## Genel Bakış

OpenClaw, güvenlik için agent'ları yalıtılmış sandbox çalışma zamanlarında çalıştırabilir. `sandbox` komutları, güncellemelerden veya yapılandırma değişikliklerinden sonra bu çalışma zamanlarını incelemenize ve yeniden oluşturmanıza yardımcı olur.

Bugün bu genellikle şu anlama gelir:

- Docker sandbox container'ları
- `agents.defaults.sandbox.backend = "ssh"` olduğunda SSH sandbox çalışma zamanları
- `agents.defaults.sandbox.backend = "openshell"` olduğunda OpenShell sandbox çalışma zamanları

`ssh` ve OpenShell `remote` için yeniden oluşturma Docker'a göre daha önemlidir:

- ilk tohumlamadan sonra uzak çalışma alanı kanoniktir
- `openclaw sandbox recreate`, seçilen kapsam için bu kanonik uzak çalışma alanını siler
- sonraki kullanım, geçerli yerel çalışma alanından tekrar tohumlar

## Komutlar

### `openclaw sandbox explain`

**Etkin** sandbox modu/kapsamı/çalışma alanı erişimini, sandbox araç ilkesini ve yükseltilmiş geçitleri inceleyin (düzeltme yapılandırma anahtarı yollarıyla).

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
- Backend (`docker`, `openshell` vb.)
- Yapılandırma etiketi ve geçerli yapılandırmayla eşleşip eşleşmediği
- Yaş (oluşturulmasından bu yana geçen süre)
- Boşta kalma süresi (son kullanımdan bu yana geçen süre)
- İlişkili oturum/agent

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
- `--agent <id>`: Belirli agent için container'ları yeniden oluştur
- `--browser`: Yalnızca tarayıcı container'larını yeniden oluştur
- `--force`: Onay istemini atla

<Note>
Çalışma zamanları, agent bir sonraki kez kullanıldığında otomatik olarak yeniden oluşturulur.
</Note>

## Kullanım örnekleri

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

### SSH hedefini veya SSH kimlik doğrulama malzemesini değiştirdikten sonra

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Çekirdek `ssh` backend'i için yeniden oluşturma, SSH hedefindeki kapsam başına uzak çalışma alanı kökünü siler. Sonraki çalıştırma, yerel çalışma alanından tekrar tohumlar.

### OpenShell kaynağını, ilkesini veya modunu değiştirdikten sonra

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` modu için yeniden oluşturma, o kapsamın kanonik uzak çalışma alanını siler. Sonraki çalıştırma, yerel çalışma alanından tekrar tohumlar.

### setupCommand'ı değiştirdikten sonra

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Yalnızca belirli bir agent için

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Buna neden ihtiyaç duyulur?

Sandbox yapılandırmasını güncellediğinizde:

- Mevcut çalışma zamanları eski ayarlarla çalışmaya devam eder.
- Çalışma zamanları yalnızca 24 saatlik hareketsizlikten sonra budanır.
- Düzenli kullanılan agent'lar eski çalışma zamanlarını süresiz olarak canlı tutar.

Eski çalışma zamanlarının kaldırılmasını zorlamak için `openclaw sandbox recreate` kullanın. Gerektiğinde, geçerli ayarlarla otomatik olarak yeniden oluşturulurlar.

<Tip>
Manuel backend'e özgü temizlik yerine `openclaw sandbox recreate` kullanmayı tercih edin. Gateway'in çalışma zamanı kayıt defterini kullanır ve kapsam veya oturum anahtarları değiştiğinde uyumsuzlukları önler.
</Tip>

## Kayıt defteri geçişi

OpenClaw, sandbox çalışma zamanı meta verilerini paylaşılan SQLite durum veritabanında saklar. Eski kurulumlarda hâlâ eski sandbox kayıt defteri dosyaları bulunabilir:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Bazı yükseltmelerde `~/.openclaw/sandbox/containers/` veya `~/.openclaw/sandbox/browsers/` altında container/tarayıcı başına bir JSON parçası da bulunabilir. Normal sandbox çalışma zamanı okumaları bu eski kaynakları yeniden yazmaz. Geçerli eski girdileri SQLite'a taşımak için `openclaw doctor --fix` çalıştırın. Geçersiz eski dosyalar karantinaya alınır, böylece tek bir bozuk eski kayıt defteri geçerli çalışma zamanı girdilerini gizleyemez.

## Yapılandırma

Sandbox ayarları `~/.openclaw/openclaw.json` içinde `agents.defaults.sandbox` altında bulunur (agent başına geçersiz kılmalar `agents.list[].sandbox` içine gider):

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

- [CLI referansı](/tr/cli)
- [Sandboxing](/tr/gateway/sandboxing)
- [Agent çalışma alanı](/tr/concepts/agent-workspace)
- [Doctor](/tr/gateway/doctor): sandbox kurulumunu denetler.
