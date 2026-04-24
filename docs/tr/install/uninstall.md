---
read_when:
    - OpenClaw'ı bir makineden kaldırmak istiyorsunuz
    - Gateway servisi kaldırmadan sonra hâlâ çalışıyor
summary: OpenClaw'ı tamamen kaldırın (CLI, servis, durum, çalışma alanı)
title: Kaldırma
x-i18n:
    generated_at: "2026-04-24T09:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

İki yol vardır:

- `openclaw` hâlâ kuruluysa **kolay yol**.
- CLI gitmiş ama servis hâlâ çalışıyorsa **elle servis kaldırma**.

## Kolay yol (CLI hâlâ kurulu)

Önerilen: yerleşik kaldırıcıyı kullanın:

```bash
openclaw uninstall
```

Etkileşimsiz (otomasyon / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Elle adımlar (aynı sonuç):

1. Gateway servisini durdurun:

```bash
openclaw gateway stop
```

2. Gateway servisini kaldırın (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Durumu + yapılandırmayı silin:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` değerini durum dizini dışında özel bir konuma ayarladıysanız, o dosyayı da silin.

4. Çalışma alanınızı silin (isteğe bağlı, agent dosyalarını kaldırır):

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI kurulumunu kaldırın (kullandığınızı seçin):

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

- Profil kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), 3. adımı her durum dizini için tekrarlayın (varsayılanlar `~/.openclaw-<profile>` şeklindedir).
- Uzak modda durum dizini **Gateway host** üzerinde bulunur; bu nedenle 1-4. adımları orada da çalıştırın.

## Elle servis kaldırma (CLI kurulu değil)

Gateway servisi çalışmaya devam ediyor ama `openclaw` yoksa bunu kullanın.

### macOS (launchd)

Varsayılan etiket `ai.openclaw.gateway` şeklindedir (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` girişleri hâlâ bulunabilir):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Profil kullandıysanız etiket ve plist adını `ai.openclaw.<profile>` ile değiştirin. Mevcutsa eski `com.openclaw.*` plist dosyalarını kaldırın.

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

## Normal kurulum ile source checkout farkı

### Normal kurulum (install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` veya `install.ps1` kullandıysanız, CLI `npm install -g openclaw@latest` ile kurulmuştur.
Bunu `npm rm -g openclaw` ile kaldırın (veya bu şekilde kurduysanız `pnpm remove -g` / `bun remove -g`).

### Source checkout (git clone)

Bir repo checkout'undan çalıştırıyorsanız (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Repo'yu silmeden **önce** Gateway servisini kaldırın (yukarıdaki kolay yolu veya elle servis kaldırmayı kullanın).
2. Repo dizinini silin.
3. Yukarıda gösterildiği gibi durumu + çalışma alanını kaldırın.

## İlgili

- [Install overview](/tr/install)
- [Migration guide](/tr/install/migrating)
