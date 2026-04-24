---
read_when:
    - Chcesz usunąć OpenClaw z maszyny
    - Usługa gateway nadal działa po odinstalowaniu
summary: Całkowite odinstalowanie OpenClaw (CLI, usługa, stan, obszar roboczy)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-04-24T09:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Dwie ścieżki:

- **Łatwa ścieżka**, jeśli `openclaw` jest nadal zainstalowany.
- **Ręczne usunięcie usługi**, jeśli CLI już nie ma, ale usługa nadal działa.

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

Kroki ręczne (ten sam rezultat):

1. Zatrzymaj usługę gateway:

```bash
openclaw gateway stop
```

2. Odinstaluj usługę gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Usuń stan + konfigurację:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jeśli ustawiłeś `OPENCLAW_CONFIG_PATH` na niestandardową lokalizację poza katalogiem stanu, usuń również ten plik.

4. Usuń obszar roboczy (opcjonalnie, usuwa pliki agenta):

```bash
rm -rf ~/.openclaw/workspace
```

5. Usuń instalację CLI (wybierz tę, której użyłeś):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Jeśli zainstalowałeś aplikację macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Uwagi:

- Jeśli używałeś profili (`--profile` / `OPENCLAW_PROFILE`), powtórz krok 3 dla każdego katalogu stanu (domyślnie są to `~/.openclaw-<profile>`).
- W trybie zdalnym katalog stanu znajduje się na **hoście gateway**, więc uruchom tam również kroki 1-4.

## Ręczne usunięcie usługi (CLI nie jest zainstalowane)

Użyj tej ścieżki, jeśli usługa gateway nadal działa, ale `openclaw` nie istnieje.

### macOS (launchd)

Domyślna etykieta to `ai.openclaw.gateway` (albo `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą nadal istnieć):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jeśli używałeś profilu, zastąp etykietę i nazwę plist przez `ai.openclaw.<profile>`. Usuń też wszelkie starsze pliki plist `com.openclaw.*`, jeśli istnieją.

### Linux (jednostka użytkownika systemd)

Domyślna nazwa jednostki to `openclaw-gateway.service` (albo `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Domyślna nazwa zadania to `OpenClaw Gateway` (albo `OpenClaw Gateway (<profile>)`).
Skrypt zadania znajduje się w katalogu stanu.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Jeśli używałeś profilu, usuń pasującą nazwę zadania i `~\.openclaw-<profile>\gateway.cmd`.

## Zwykła instalacja vs checkout ze źródła

### Zwykła instalacja (`install.sh` / npm / pnpm / bun)

Jeśli użyłeś `https://openclaw.ai/install.sh` albo `install.ps1`, CLI zostało zainstalowane przez `npm install -g openclaw@latest`.
Usuń je przez `npm rm -g openclaw` (albo `pnpm remove -g` / `bun remove -g`, jeśli instalowałeś w ten sposób).

### Checkout ze źródła (`git clone`)

Jeśli uruchamiasz z checkoutu repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Odinstaluj usługę gateway **przed** usunięciem repo (użyj łatwej ścieżki powyżej albo ręcznego usunięcia usługi).
2. Usuń katalog repo.
3. Usuń stan + obszar roboczy, jak pokazano wyżej.

## Powiązane

- [Install overview](/pl/install)
- [Migration guide](/pl/install/migrating)
