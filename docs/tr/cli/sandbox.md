---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox çalışma zamanlarını yönetin ve etkin sandbox ilkesini inceleyin
title: Sandbox CLI
x-i18n:
    generated_at: "2026-04-05T13:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# Sandbox CLI

Yalıtılmış agent yürütmesi için sandbox çalışma zamanlarını yönetin.

## Genel bakış

OpenClaw, güvenlik amacıyla agent'ları yalıtılmış sandbox çalışma zamanlarında çalıştırabilir. `sandbox` komutları, güncellemeler veya yapılandırma değişikliklerinden sonra bu çalışma zamanlarını incelemenize ve yeniden oluşturmanıza yardımcı olur.

Bugün bu genellikle şunları ifade eder:

- Docker sandbox kapsayıcıları
- `agents.defaults.sandbox.backend = "ssh"` olduğunda SSH sandbox çalışma zamanları
- `agents.defaults.sandbox.backend = "openshell"` olduğunda OpenShell sandbox çalışma zamanları

`ssh` ve OpenShell `remote` için yeniden oluşturma, Docker'a kıyasla daha önemlidir:

- ilk tohumlamadan sonra uzak çalışma alanı kanoniktir
- `openclaw sandbox recreate`, seçilen kapsam için bu kanonik uzak çalışma alanını siler
- sonraki kullanımda geçerli yerel çalışma alanından yeniden tohumlanır

## Komutlar

### `openclaw sandbox explain`

**Etkin** sandbox modunu/kapsamını/çalışma alanı erişimini, sandbox araç ilkesini ve yükseltilmiş geçitleri inceleyin (düzeltme için config anahtar yolu konumlarıyla birlikte).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Tüm sandbox çalışma zamanlarını durumları ve yapılandırmalarıyla birlikte listeleyin.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Yalnızca tarayıcı kapsayıcılarını listele
openclaw sandbox list --json     # JSON çıktısı
```

**Çıktı şunları içerir:**

- Çalışma zamanı adı ve durumu
- Backend (`docker`, `openshell` vb.)
- Config etiketi ve geçerli config ile eşleşip eşleşmediği
- Yaş (oluşturulmasından bu yana geçen süre)
- Boşta kalma süresi (son kullanımdan bu yana geçen süre)
- İlişkili oturum/agent

### `openclaw sandbox recreate`

Güncellenmiş config ile yeniden oluşturmayı zorlamak için sandbox çalışma zamanlarını kaldırın.

```bash
openclaw sandbox recreate --all                # Tüm kapsayıcıları yeniden oluştur
openclaw sandbox recreate --session main       # Belirli oturum
openclaw sandbox recreate --agent mybot        # Belirli agent
openclaw sandbox recreate --browser            # Yalnızca tarayıcı kapsayıcıları
openclaw sandbox recreate --all --force        # Onayı atla
```

**Seçenekler:**

- `--all`: Tüm sandbox kapsayıcılarını yeniden oluştur
- `--session <key>`: Belirli bir oturum için kapsayıcıyı yeniden oluştur
- `--agent <id>`: Belirli bir agent için kapsayıcıları yeniden oluştur
- `--browser`: Yalnızca tarayıcı kapsayıcılarını yeniden oluştur
- `--force`: Onay istemini atla

**Önemli:** Agent bir sonraki kullanımda çalışma zamanları otomatik olarak yeniden oluşturulur.

## Kullanım durumları

### Bir Docker imajını güncelledikten sonra

```bash
# Yeni imajı çek
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Yeni imajı kullanacak şekilde config'i güncelle
# Config'i düzenle: agents.defaults.sandbox.docker.image (veya agents.list[].sandbox.docker.image)

# Kapsayıcıları yeniden oluştur
openclaw sandbox recreate --all
```

### Sandbox yapılandırmasını değiştirdikten sonra

```bash
# Config'i düzenle: agents.defaults.sandbox.* (veya agents.list[].sandbox.*)

# Yeni config'i uygulamak için yeniden oluştur
openclaw sandbox recreate --all
```

### SSH hedefini veya SSH kimlik doğrulama materyalini değiştirdikten sonra

```bash
# Config'i düzenle:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Çekirdek `ssh` backend'i için yeniden oluşturma, SSH hedefindeki kapsam başına uzak çalışma alanı kökünü siler. Sonraki çalıştırma bunu yerel çalışma alanından yeniden tohumlar.

### OpenShell kaynağını, ilkesini veya modunu değiştirdikten sonra

```bash
# Config'i düzenle:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` modu için yeniden oluşturma, o kapsamın kanonik uzak çalışma alanını siler. Sonraki çalıştırma bunu yerel çalışma alanından yeniden tohumlar.

### setupCommand değiştirildikten sonra

```bash
openclaw sandbox recreate --all
# veya yalnızca bir agent:
openclaw sandbox recreate --agent family
```

### Yalnızca belirli bir agent için

```bash
# Yalnızca bir agent'ın kapsayıcılarını güncelle
openclaw sandbox recreate --agent alfred
```

## Buna neden ihtiyaç var?

**Sorun:** Sandbox yapılandırmasını güncellediğinizde:

- Mevcut çalışma zamanları eski ayarlarla çalışmaya devam eder
- Çalışma zamanları yalnızca 24 saatlik hareketsizlikten sonra budanır
- Düzenli olarak kullanılan agent'lar eski çalışma zamanlarını süresiz olarak canlı tutar

**Çözüm:** Eski çalışma zamanlarının kaldırılmasını zorlamak için `openclaw sandbox recreate` kullanın. Sonraki ihtiyaç duyulduğunda geçerli ayarlarla otomatik olarak yeniden oluşturulurlar.

İpucu: elle backend'e özgü temizlik yapmak yerine `openclaw sandbox recreate` kullanmayı tercih edin.
Gateway'in çalışma zamanı kayıt defterini kullanır ve kapsam/oturum anahtarları değiştiğinde uyuşmazlıkları önler.

## Yapılandırma

Sandbox ayarları `~/.openclaw/openclaw.json` içinde `agents.defaults.sandbox` altında bulunur (`agent` başına geçersiz kılmalar `agents.list[].sandbox` içine gider):

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
          // ... daha fazla Docker seçeneği
        },
        "prune": {
          "idleHours": 24, // 24 saat boşta kaldıktan sonra otomatik budama
          "maxAgeDays": 7, // 7 gün sonra otomatik budama
        },
      },
    },
  },
}
```

## Ayrıca bkz.

- [Sandbox Belgeleri](/gateway/sandboxing)
- [Agent Yapılandırması](/concepts/agent-workspace)
- [Doctor Komutu](/gateway/doctor) - Sandbox kurulumunu kontrol edin
