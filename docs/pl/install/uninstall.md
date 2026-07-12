---
read_when:
    - Chcesz usunąć OpenClaw z komputera
    - Usługa Gateway nadal działa po odinstalowaniu
summary: Całkowicie odinstaluj OpenClaw (CLI, usługę, stan i obszar roboczy)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-07-12T15:15:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Dwie ścieżki:

- **Łatwa ścieżka**, jeśli `openclaw` jest nadal zainstalowany.
- **Ręczne usunięcie usługi**, jeśli CLI nie jest już dostępny, ale usługa nadal działa.

## Łatwa ścieżka (CLI nadal zainstalowany)

Zalecane: użyj wbudowanego deinstalatora:

```bash
openclaw uninstall
```

Usunięcie stanu zachowuje skonfigurowane katalogi obszaru roboczego, chyba że wybierzesz również `--workspace`.

Wyświetl podgląd elementów, które zostaną usunięte (bezpieczne):

```bash
openclaw uninstall --dry-run --all
```

Tryb nieinteraktywny (automatyzacja / npx). Używaj ostrożnie i tylko po potwierdzeniu zakresów:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flagi: `--service`, `--state`, `--workspace`, `--app` wybierają poszczególne zakresy; `--all` wybiera wszystkie cztery.

Czynności ręczne (ten sam rezultat):

1. Zatrzymaj usługę Gateway:

```bash
openclaw gateway stop
```

2. Odinstaluj usługę Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Usuń stan i konfigurację:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jeśli ustawiono `OPENCLAW_CONFIG_PATH` na niestandardową lokalizację poza katalogiem stanu, usuń również ten plik.
Jeśli chcesz zachować obszar roboczy znajdujący się w katalogu stanu, na przykład `~/.openclaw/workspace`, przenieś go w inne miejsce przed uruchomieniem `rm -rf` albo usuń zawartość katalogu stanu wybiórczo.

4. Usuń obszar roboczy (opcjonalne, usuwa pliki agenta):

```bash
rm -rf ~/.openclaw/workspace
```

5. Usuń instalację CLI (wybierz użyty sposób instalacji):

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

- Jeśli używano profili (`--profile` / `OPENCLAW_PROFILE`), powtórz krok 3 dla każdego katalogu stanu (domyślne katalogi to `~/.openclaw-<profile>`).
- W trybie zdalnym katalog stanu znajduje się na **hoście Gateway**, więc wykonaj tam również kroki 1–4.

## Ręczne usunięcie usługi (CLI nie jest zainstalowany)

Użyj tej metody, jeśli usługa Gateway nadal działa, ale brakuje polecenia `openclaw`.

### macOS (launchd)

Domyślna etykieta to `ai.openclaw.gateway` (lub `ai.openclaw.<profile>` w przypadku profilu):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jeśli używano profilu, zastąp etykietę i nazwę pliku plist wartością `ai.openclaw.<profile>`.

### Linux (jednostka użytkownika systemd)

Domyślna nazwa jednostki to `openclaw-gateway.service` (lub `openclaw-gateway-<profile>.service`). Jednostka sprzed zmiany nazwy, `clawdbot-gateway.service`, może nadal istnieć na komputerach zaktualizowanych z bardzo starych instalacji; polecenie `openclaw uninstall` / `openclaw gateway uninstall` wykrywa ją i usuwa automatycznie.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (zaplanowane zadanie)

Domyślna nazwa zadania to `OpenClaw Gateway` (lub `OpenClaw Gateway (<profile>)`).
Zadanie uruchamia bezokienkowy skrypt `gateway.vbs` w katalogu stanu, który następnie
uruchamia `gateway.cmd`; usuń oba pliki.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Jeśli używano profilu, usuń zadanie o odpowiedniej nazwie oraz pliki `gateway.cmd` /
`gateway.vbs` z katalogu `~\.openclaw-<profile>`.

## Zwykła instalacja a kopia robocza kodu źródłowego

### Zwykła instalacja (install.sh / npm / pnpm / bun)

Jeśli użyto `https://openclaw.ai/install.sh` lub `install.ps1`, CLI zainstalowano za pomocą polecenia `npm install -g openclaw@latest`.
Usuń go za pomocą `npm rm -g openclaw` (lub `pnpm remove -g` / `bun remove -g`, jeśli instalacja została wykonana w ten sposób).

### Kopia robocza kodu źródłowego (git clone)

Jeśli uruchamiasz program z kopii roboczej repozytorium (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Odinstaluj usługę Gateway **przed** usunięciem repozytorium (użyj łatwej ścieżki opisanej powyżej lub ręcznego usunięcia usługi).
2. Usuń katalog repozytorium.
3. Usuń stan i obszar roboczy zgodnie z powyższym opisem.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Przewodnik po migracji](/pl/install/migrating)
