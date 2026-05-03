---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Korumalı alan çalışma zamanlarını yönetin ve yürürlükteki korumalı alan politikasını inceleyin
title: Korumalı Alan CLI
x-i18n:
    generated_at: "2026-05-03T21:29:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Yalıtılmış ajan yürütmesi için sandbox çalışma zamanlarını yönetin.

## Genel Bakış

OpenClaw, güvenlik için ajanları yalıtılmış sandbox çalışma zamanlarında çalıştırabilir. `sandbox` komutları, güncellemelerden veya yapılandırma değişikliklerinden sonra bu çalışma zamanlarını incelemenize ve yeniden oluşturmanıza yardımcı olur.

Günümüzde bu genellikle şunlar anlamına gelir:

- Docker sandbox container'ları
- `agents.defaults.sandbox.backend = "ssh"` olduğunda SSH sandbox çalışma zamanları
- `agents.defaults.sandbox.backend = "openshell"` olduğunda OpenShell sandbox çalışma zamanları

`ssh` ve OpenShell `remote` için yeniden oluşturma, Docker'a göre daha önemlidir:

- uzak çalışma alanı, ilk tohumlamadan sonra kanoniktir
- `openclaw sandbox recreate`, seçili kapsam için bu kanonik uzak çalışma alanını siler
- sonraki kullanım, geçerli yerel çalışma alanından yeniden tohumlar

## Komutlar

### `openclaw sandbox explain`

**Etkin** sandbox modunu/kapsamını/çalışma alanı erişimini, sandbox araç politikasını ve yükseltilmiş kapıları (düzeltme yapılandırma anahtarı yollarıyla) inceleyin.

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
Çalışma zamanları, ajan bir sonraki kullanıldığında otomatik olarak yeniden oluşturulur.
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

Çekirdek `ssh` backend'i için yeniden oluşturma, SSH hedefindeki kapsam başına uzak çalışma alanı kökünü siler. Sonraki çalıştırma, yerel çalışma alanından yeniden tohumlar.

### OpenShell kaynağını, politikasını veya modunu değiştirdikten sonra

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` modu için yeniden oluşturma, o kapsama ait kanonik uzak çalışma alanını siler. Sonraki çalıştırma, yerel çalışma alanından yeniden tohumlar.

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

## Bu neden gerekli

Sandbox yapılandırmasını güncellediğinizde:

- Mevcut çalışma zamanları eski ayarlarla çalışmaya devam eder.
- Çalışma zamanları yalnızca 24 saat hareketsizlikten sonra budanır.
- Düzenli kullanılan ajanlar eski çalışma zamanlarını süresiz olarak canlı tutar.

Eski çalışma zamanlarının kaldırılmasını zorlamak için `openclaw sandbox recreate` kullanın. Sonraki ihtiyaçta geçerli ayarlarla otomatik olarak yeniden oluşturulurlar.

<Tip>
Manuel backend'e özgü temizleme yerine `openclaw sandbox recreate` tercih edin. Gateway'in çalışma zamanı kayıt defterini kullanır ve kapsam veya oturum anahtarları değiştiğinde uyuşmazlıkları önler.
</Tip>

## Kayıt defteri geçişi

OpenClaw, sandbox çalışma zamanı meta verilerini sandbox durum dizini altında her container/browser girdisi için bir JSON parçası olarak saklar. Eski kurulumlarda hâlâ monolitik eski dosyalar bulunabilir:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Normal sandbox çalışma zamanı okumaları bu dosyaları yeniden yazmaz. Geçerli eski girdileri parçalı kayıt defteri dizinlerine geçirmek için `openclaw doctor --fix` çalıştırın. Geçersiz eski dosyalar karantinaya alınır; böylece tek bir bozuk eski kayıt defteri, geçerli çalışma zamanı girdilerini gizleyemez.

## Yapılandırma

Sandbox ayarları `~/.openclaw/openclaw.json` içinde `agents.defaults.sandbox` altında bulunur (ajan başına geçersiz kılmalar `agents.list[].sandbox` içine gider):

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
