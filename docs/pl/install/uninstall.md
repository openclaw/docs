---
read_when:
    - Chcesz usunąć OpenClaw z maszyny
    - Usługa gateway nadal działa po odinstalowaniu
summary: Całkowite odinstalowanie OpenClaw (CLI, usługa, stan, workspace)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-04-05T13:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Odinstalowanie

Dwie ścieżki:

- **Łatwa ścieżka**, jeśli `openclaw` jest nadal zainstalowany.
- **Ręczne usuwanie usługi**, jeśli CLI już zniknęło, ale usługa nadal działa.

## Łatwa ścieżka (CLI nadal zainstalowane)

Zalecane: użyj wbudowanego deinstalatora:

```bash
openclaw uninstall
```

Tryb nieinteraktywny (automatyzacja / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Kroki ręczne (ten sam efekt):

1. Zatrzymaj usługę gateway:

```bash
openclaw gateway stop
```

2. Odinstaluj usługę gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Usuń stan + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jeśli ustawiono `OPENCLAW_CONFIG_PATH` na niestandardową lokalizację poza katalogiem stanu, usuń również ten plik.

4. Usuń workspace (opcjonalnie, usuwa pliki agentów):

```bash
rm -rf ~/.openclaw/workspace
```

5. Usuń instalację CLI (wybierz tę, której użyto):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Jeśli zainstalowano aplikację macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Uwagi:

- Jeśli używano profili (`--profile` / `OPENCLAW_PROFILE`), powtórz krok 3 dla każdego katalogu stanu (domyślnie są to `~/.openclaw-<profile>`).
- W trybie zdalnym katalog stanu znajduje się na **hoście gateway**, więc wykonaj tam również kroki 1-4.

## Ręczne usuwanie usługi (CLI nie jest zainstalowane)

Użyj tej ścieżki, jeśli usługa gateway nadal działa, ale `openclaw` nie istnieje.

### macOS (launchd)

Domyślna etykieta to `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą nadal istnieć):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jeśli używano profilu, zastąp etykietę i nazwę plist przez `ai.openclaw.<profile>`. Usuń też wszelkie starsze pliki plist `com.openclaw.*`, jeśli istnieją.

### Linux (jednostka użytkownika systemd)

Domyślna nazwa jednostki to `openclaw-gateway.service` (lub `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Domyślna nazwa zadania to `OpenClaw Gateway` (lub `OpenClaw Gateway (<profile>)`).
Skrypt zadania znajduje się w katalogu stanu.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Jeśli używano profilu, usuń odpowiednią nazwę zadania i `~\.openclaw-<profile>\gateway.cmd`.

## Zwykła instalacja a checkout ze źródeł

### Zwykła instalacja (install.sh / npm / pnpm / bun)

Jeśli użyto `https://openclaw.ai/install.sh` lub `install.ps1`, CLI zostało zainstalowane przez `npm install -g openclaw@latest`.
Usuń je przez `npm rm -g openclaw` (lub `pnpm remove -g` / `bun remove -g`, jeśli instalowano w ten sposób).

### Checkout ze źródeł (git clone)

Jeśli uruchamiasz z checkoutu repozytorium (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Odinstaluj usługę gateway **przed** usunięciem repozytorium (użyj łatwej ścieżki powyżej albo ręcznego usuwania usługi).
2. Usuń katalog repozytorium.
3. Usuń stan + workspace, jak pokazano powyżej.
