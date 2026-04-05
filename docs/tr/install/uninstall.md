---
read_when:
    - OpenClaw'ı bir makineden kaldırmak istediğinizde
    - Kaldırma işleminden sonra gateway hizmeti hâlâ çalışıyorsa
summary: OpenClaw'ı tamamen kaldırın (CLI, hizmet, durum, çalışma alanı)
title: Kaldırma
x-i18n:
    generated_at: "2026-04-05T13:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Kaldırma

İki yol vardır:

- `openclaw` hâlâ kuruluysa **kolay yol**
- CLI yoksa ama hizmet hâlâ çalışıyorsa **el ile hizmet kaldırma**

## Kolay yol (CLI hâlâ kurulu)

Önerilen yöntem: yerleşik kaldırıcıyı kullanın:

```bash
openclaw uninstall
```

Etkileşimsiz kullanım (otomasyon / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

El ile adımlar (aynı sonucu verir):

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

`OPENCLAW_CONFIG_PATH` değerini durum dizini dışındaki özel bir konuma ayarladıysanız o dosyayı da silin.

4. Çalışma alanınızı silin (isteğe bağlı, ajan dosyalarını kaldırır):

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI kurulumunu kaldırın (kullandığınız yöntemi seçin):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS uygulamasını kurduysanız:

```bash
rm -rf /Applications/OpenClaw.app
```

Notlar:

- Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizini için 3. adımı tekrarlayın (varsayılanlar `~/.openclaw-<profile>` şeklindedir).
- Uzak modda durum dizini **gateway ana makinesinde** bulunur, bu yüzden 1-4. adımları orada da çalıştırın.

## El ile hizmet kaldırma (CLI kurulu değil)

Gateway hizmeti çalışmaya devam ediyor ama `openclaw` yoksa bunu kullanın.

### macOS (launchd)

Varsayılan etiket `ai.openclaw.gateway` şeklindedir (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` girdileri hâlâ bulunabilir):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Profil kullandıysanız etiketi ve plist adını `ai.openclaw.<profile>` ile değiştirin. Varsa eski `com.openclaw.*` plist dosyalarını kaldırın.

### Linux (systemd kullanıcı birimi)

Varsayılan birim adı `openclaw-gateway.service` şeklindedir (veya `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Varsayılan görev adı `OpenClaw Gateway` şeklindedir (veya `OpenClaw Gateway (<profile>)`).
Görev betiği durum dizininiz altında bulunur.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Profil kullandıysanız eşleşen görev adını ve `~\.openclaw-<profile>\gateway.cmd` dosyasını silin.

## Normal kurulum ile kaynak checkout karşılaştırması

### Normal kurulum (install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` veya `install.ps1` kullandıysanız CLI, `npm install -g openclaw@latest` ile kurulmuştur.
Bunu `npm rm -g openclaw` ile kaldırın (veya o şekilde kurduysanız `pnpm remove -g` / `bun remove -g`).

### Kaynak checkout (git clone)

Bir repo checkout içinden çalıştırıyorsanız (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Depoyu silmeden **önce** gateway hizmetini kaldırın (yukarıdaki kolay yolu veya el ile hizmet kaldırmayı kullanın).
2. Repo dizinini silin.
3. Yukarıda gösterildiği gibi durum + çalışma alanını kaldırın.
