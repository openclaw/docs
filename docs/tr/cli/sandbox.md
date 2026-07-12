---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Korumalı alan çalışma zamanlarını yönetin ve geçerli korumalı alan politikasını inceleyin
title: Sandbox CLI
x-i18n:
    generated_at: "2026-07-12T12:10:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Yalıtılmış ajan yürütmesi için sandbox çalışma ortamlarını yönetin: Docker kapsayıcıları, SSH hedefleri veya OpenShell arka uçları.

## Komutlar

### `openclaw sandbox list`

Sandbox çalışma ortamlarını durum, arka uç, yapılandırma eşleşmesi, yaş, boşta kalma süresi ve ilişkili oturum/ajan bilgileriyle listeleyin.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # yalnızca tarayıcı kapsayıcıları
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Geçerli yapılandırmayla yeniden oluşturulmalarını zorlamak için sandbox çalışma ortamlarını kaldırın. Çalışma ortamları, ajan bir sonraki kez kullanıldığında otomatik olarak yeniden oluşturulur.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # agent:mybot:* alt oturumlarını içerir
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # yalnızca tarayıcı kapsayıcıları
openclaw sandbox recreate --all --force        # onayı atla
```

Seçenekler:

- `--all`: tüm sandbox kapsayıcılarını yeniden oluşturur
- `--session <key>`: çalışma ortamını bu tam kapsam anahtarıyla (`sandbox list` tarafından gösterildiği şekilde) yeniden oluşturur; kısa ad genişletmesi yapılmaz
- `--agent <id>`: bir ajan için çalışma ortamlarını yeniden oluşturur (`agent:<id>` ve `agent:<id>:*` ile eşleşir)
- `--browser`: yalnızca tarayıcı kapsayıcılarını etkiler
- `--force`: onay istemini atlar

`--all`, `--session` veya `--agent` seçeneklerinden tam olarak birini iletin.

`ssh` ve OpenShell `remote` için yeniden oluşturma, Docker'a kıyasla daha önemlidir: ilk başlangıç verilerinin aktarılmasından sonra uzak çalışma alanı asıl kaynaktır; `recreate`, seçilen kapsamın bu asıl uzak çalışma alanını siler ve sonraki çalıştırma, geçerli yerel çalışma alanından yeniden başlangıç verilerini aktarır.

### `openclaw sandbox explain`

Etkin sandbox modunu/kapsamını/çalışma alanı erişimini, sandbox araç politikasını ve yükseltilmiş araç geçitlerini (düzeltme yapılandırma anahtarı yollarıyla birlikte) inceleyin.

Rapor, `workspaceRoot` değerini yapılandırılmış sandbox kökü olarak korur ve etkin ana makine çalışma alanını, arka uç çalışma ortamı çalışma dizinini ve Docker bağlama tablosunu ayrı olarak gösterir. `workspaceAccess: "rw"` için etkin ana makine çalışma alanı, `workspaceRoot` altındaki bir dizin yerine ajan çalışma alanıdır.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

`recreate --session` seçeneğinden farklı olarak bu komut, kısa oturum adlarını (örneğin `main`) kabul eder ve bunları çözümlenmiş ajana göre genişletir.

## Yeniden oluşturma neden gereklidir?

Sandbox yapılandırmasını güncellemek çalışan kapsayıcıları etkilemez: mevcut çalışma ortamları eski ayarlarını korur ve boşta olan çalışma ortamları yalnızca `prune.idleHours` sonrasında (varsayılan 24 saat) temizlenir. Düzenli kullanılan ajanlar, güncelliğini yitirmiş çalışma ortamlarını süresiz olarak etkin tutabilir. `openclaw sandbox recreate`, eski çalışma ortamını kaldırır; böylece sonraki kullanımda geçerli yapılandırmadan yeniden oluşturulur.

<Tip>
Arka uca özgü elle temizleme yerine `openclaw sandbox recreate` komutunu tercih edin. Bu komut Gateway'in çalışma ortamı kayıt defterini kullanır ve kapsam ya da oturum anahtarları değiştiğinde oluşabilecek uyumsuzlukları önler.
</Tip>

## Yaygın tetikleyiciler

| Değişiklik                                                                                                                                                     | Komut                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker imajı güncellemesi (`agents.defaults.sandbox.docker.image`)                                                                                             | `openclaw sandbox recreate --all`                                   |
| Sandbox yapılandırması (`agents.defaults.sandbox.*`)                                                                                                           | `openclaw sandbox recreate --all`                                   |
| SSH hedefi/kimlik doğrulaması (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| OpenShell kaynağı/politikası/modu (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                       | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (veya tek bir ajan için `--agent <id>`) |

<Note>
Çalışma ortamları, ajan bir sonraki kez kullanıldığında otomatik olarak yeniden oluşturulur.
</Note>

## Kayıt defteri geçişi

Sandbox çalışma ortamı meta verileri, paylaşılan SQLite durum veritabanında bulunur. Eski kurulumlarda, normal okumaların artık yeniden yazmadığı eski kayıt defteri dosyaları bulunabilir:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` veya `~/.openclaw/sandbox/browsers/` altında kapsayıcı/tarayıcı başına bir JSON parçası

Geçerli eski girdileri SQLite'a taşımak için `openclaw doctor --fix` komutunu çalıştırın. Bozuk eski bir kayıt defterinin geçerli çalışma ortamı girdilerini gizleyememesi için geçersiz eski dosyalar karantinaya alınır.

## Yapılandırma

Sandbox ayarları, `~/.openclaw/openclaw.json` dosyasında `agents.defaults.sandbox` altında bulunur (ajan başına geçersiz kılmalar `agents.list[].sandbox` içine yazılır):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin tarafından sağlanır)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... diğer Docker seçenekleri
        },
        "prune": {
          "idleHours": 24, // 24 saat boşta kaldıktan sonra otomatik temizle
          "maxAgeDays": 7, // 7 gün sonra otomatik temizle
        },
      },
    },
  },
}
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Sandbox kullanımı](/tr/gateway/sandboxing)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Doctor](/tr/gateway/doctor): sandbox kurulumunu denetler.
