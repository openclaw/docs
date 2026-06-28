---
read_when:
    - OpenClaw'u bir makineden kaldırmak istiyorsunuz
    - Gateway hizmeti kaldırmadan sonra hâlâ çalışıyor
summary: OpenClaw’ı tamamen kaldırın (CLI, servis, durum, çalışma alanı)
title: Kaldırma
x-i18n:
    generated_at: "2026-06-28T00:45:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

İki yol:

- `openclaw` hâlâ yüklüyse **kolay yol**.
- CLI kaldırılmışsa ancak hizmet hâlâ çalışıyorsa **elle hizmet kaldırma**.

## Kolay yol (CLI hâlâ yüklü)

Önerilen: yerleşik kaldırıcıyı kullanın:

```bash
openclaw uninstall
```

CLI kullanılırken, `--workspace` seçeneğini de seçmediğiniz sürece durum kaldırma, yapılandırılmış çalışma alanı dizinlerini korur.

Nelerin kaldırılacağını önizleyin (güvenli):

```bash
openclaw uninstall --dry-run --all
```

Etkileşimsiz (otomasyon / npx). Dikkatli kullanın ve yalnızca kapsamları doğruladıktan sonra çalıştırın:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Elle adımlar (aynı sonuç):

1. Gateway hizmetini durdurun:

```bash
openclaw gateway stop
```

2. Gateway hizmetini kaldırın (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Durumu + yapılandırmayı silin:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` değerini durum dizininin dışında özel bir konuma ayarladıysanız, o dosyayı da silin.
Durum dizininin içinde `~/.openclaw/workspace` gibi bir çalışma alanını tutmak istiyorsanız, `rm -rf` çalıştırmadan önce onu kenara taşıyın veya durum içeriklerini seçerek silin.

4. Çalışma alanınızı silin (isteğe bağlı, ajan dosyalarını kaldırır):

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI kurulumunu kaldırın (kullandığınızı seçin):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS uygulamasını yüklediyseniz:

```bash
rm -rf /Applications/OpenClaw.app
```

Notlar:

- Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizini için 3. adımı tekrarlayın (varsayılanlar `~/.openclaw-<profile>` şeklindedir).
- Uzak modda durum dizini **gateway ana makinesinde** bulunur, bu nedenle 1-4. adımları orada da çalıştırın.

## Elle hizmet kaldırma (CLI yüklü değil)

Gateway hizmeti çalışmaya devam ediyorsa ancak `openclaw` eksikse bunu kullanın.

### macOS (launchd)

Varsayılan etiket `ai.openclaw.gateway` şeklindedir (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` hâlâ mevcut olabilir):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Profil kullandıysanız, etiketi ve plist adını `ai.openclaw.<profile>` ile değiştirin. Varsa eski `com.openclaw.*` plist dosyalarını kaldırın.

### Linux (systemd kullanıcı birimi)

Varsayılan birim adı `openclaw-gateway.service` şeklindedir (veya `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Zamanlanmış Görev)

Varsayılan görev adı `OpenClaw Gateway` şeklindedir (veya `OpenClaw Gateway (<profile>)`).
Görev betiği durum dizininizin altında `gateway.cmd` olarak bulunur; güncel kurulumlar
ayrıca Görev Zamanlayıcı'nın `gateway.cmd` dosyasını doğrudan açmak yerine çalıştırdığı penceresiz bir `gateway.vbs` başlatıcısı da
oluşturabilir.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Profil kullandıysanız, eşleşen görev adını ve `~\.openclaw-<profile>` altındaki `gateway.cmd` /
`gateway.vbs` dosyalarını silin.

## Normal kurulum ve kaynak deposu çalışma kopyası

### Normal kurulum (install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` veya `install.ps1` kullandıysanız, CLI `npm install -g openclaw@latest` ile yüklenmiştir.
`npm rm -g openclaw` ile kaldırın (veya o şekilde yüklediyseniz `pnpm remove -g` / `bun remove -g`).

### Kaynak deposu çalışma kopyası (git clone)

Bir repo çalışma kopyasından çalıştırıyorsanız (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Repoyu silmeden **önce** Gateway hizmetini kaldırın (yukarıdaki kolay yolu veya elle hizmet kaldırmayı kullanın).
2. Repo dizinini silin.
3. Durumu + çalışma alanını yukarıda gösterildiği gibi kaldırın.

## İlgili

- [Kurulum özeti](/tr/install)
- [Geçiş kılavuzu](/tr/install/migrating)
