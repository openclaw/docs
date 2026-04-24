---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox çalışma zamanlarını yönetin ve etkin sandbox politikasını inceleyin
title: Sandbox CLI
x-i18n:
    generated_at: "2026-04-24T09:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Yalıtılmış ajan yürütmesi için sandbox çalışma zamanlarını yönetin.

## Genel bakış

OpenClaw, güvenlik için ajanları yalıtılmış sandbox çalışma zamanlarında çalıştırabilir. `sandbox` komutları, güncellemelerden veya yapılandırma değişikliklerinden sonra bu çalışma zamanlarını incelemenize ve yeniden oluşturmanıza yardımcı olur.

Bugün bu genellikle şu anlama gelir:

- Docker sandbox container'ları
- `agents.defaults.sandbox.backend = "ssh"` olduğunda SSH sandbox çalışma zamanları
- `agents.defaults.sandbox.backend = "openshell"` olduğunda OpenShell sandbox çalışma zamanları

`ssh` ve OpenShell `remote` için yeniden oluşturma, Docker'a göre daha önemlidir:

- ilk tohumlamadan sonra uzak çalışma alanı kanonik olur
- `openclaw sandbox recreate`, seçilen kapsam için bu kanonik uzak çalışma alanını siler
- sonraki kullanım bunu geçerli yerel çalışma alanından yeniden tohumlar

## Komutlar

### `openclaw sandbox explain`

**Etkin** sandbox modu/kapsamı/çalışma alanı erişimini, sandbox araç politikasını ve yükseltilmiş geçitleri (düzeltme için yapılandırma anahtarı yollarıyla birlikte) inceleyin.

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
openclaw sandbox list --browser  # Yalnızca tarayıcı container'larını listele
openclaw sandbox list --json     # JSON çıktısı
```

**Çıktı şunları içerir:**

- Çalışma zamanı adı ve durumu
- Backend (`docker`, `openshell` vb.)
- Yapılandırma etiketi ve geçerli yapılandırmayla eşleşip eşleşmediği
- Yaş (oluşturulmasından beri geçen süre)
- Boşta kalma süresi (son kullanımdan beri geçen süre)
- İlişkili oturum/ajan

### `openclaw sandbox recreate`

Güncellenmiş yapılandırmayla yeniden oluşturulmalarını zorlamak için sandbox çalışma zamanlarını kaldırın.

```bash
openclaw sandbox recreate --all                # Tüm container'ları yeniden oluştur
openclaw sandbox recreate --session main       # Belirli oturum
openclaw sandbox recreate --agent mybot        # Belirli ajan
openclaw sandbox recreate --browser            # Yalnızca tarayıcı container'ları
openclaw sandbox recreate --all --force        # Onayı atla
```

**Seçenekler:**

- `--all`: Tüm sandbox container'larını yeniden oluştur
- `--session <key>`: Belirli oturum için container'ı yeniden oluştur
- `--agent <id>`: Belirli ajan için container'ları yeniden oluştur
- `--browser`: Yalnızca tarayıcı container'larını yeniden oluştur
- `--force`: Onay istemini atla

**Önemli:** Çalışma zamanları, ajan bir sonraki kullanımında otomatik olarak yeniden oluşturulur.

## Kullanım durumları

### Bir Docker image'ını güncelledikten sonra

```bash
# Yeni image'ı çek
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Yeni image'ı kullanacak şekilde yapılandırmayı güncelle
# Yapılandırmayı düzenle: agents.defaults.sandbox.docker.image (veya agents.list[].sandbox.docker.image)

# Container'ları yeniden oluştur
openclaw sandbox recreate --all
```

### Sandbox yapılandırmasını değiştirdikten sonra

```bash
# Yapılandırmayı düzenle: agents.defaults.sandbox.* (veya agents.list[].sandbox.*)

# Yeni yapılandırmayı uygulamak için yeniden oluştur
openclaw sandbox recreate --all
```

### SSH hedefini veya SSH kimlik doğrulama materyalini değiştirdikten sonra

```bash
# Yapılandırmayı düzenle:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Çekirdek `ssh` backend'i için yeniden oluşturma, SSH hedefindeki kapsam başına uzak çalışma alanı kökünü siler. Sonraki çalıştırma bunu yerel çalışma alanından yeniden tohumlar.

### OpenShell kaynağını, politikasını veya modunu değiştirdikten sonra

```bash
# Yapılandırmayı düzenle:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` modu için yeniden oluşturma, o kapsam için kanonik uzak çalışma alanını siler. Sonraki çalıştırma bunu yerel çalışma alanından yeniden tohumlar.

### `setupCommand` değiştirdikten sonra

```bash
openclaw sandbox recreate --all
# veya yalnızca bir ajan:
openclaw sandbox recreate --agent family
```

### Yalnızca belirli bir ajan için

```bash
# Yalnızca bir ajanın container'larını güncelle
openclaw sandbox recreate --agent alfred
```

## Bu neden gerekli?

**Sorun:** Sandbox yapılandırmasını güncellediğinizde:

- Mevcut çalışma zamanları eski ayarlarla çalışmaya devam eder
- Çalışma zamanları yalnızca 24 saatlik hareketsizlikten sonra budanır
- Düzenli kullanılan ajanlar eski çalışma zamanlarını süresiz olarak canlı tutar

**Çözüm:** Eski çalışma zamanlarını zorla kaldırmak için `openclaw sandbox recreate` kullanın. Bir sonraki ihtiyaç anında geçerli ayarlarla otomatik olarak yeniden oluşturulurlar.

İpucu: elle backend'e özgü temizlik yerine `openclaw sandbox recreate` tercih edin.
Gateway'in çalışma zamanı kayıt defterini kullanır ve kapsam/oturum anahtarları değiştiğinde uyumsuzlukları önler.

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

## İlgili

- [CLI başvurusu](/tr/cli)
- [Sandboxing](/tr/gateway/sandboxing)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Doctor](/tr/gateway/doctor) — sandbox kurulumunu kontrol eder
