---
read_when:
    - Chcesz usunąć OpenClaw z komputera
    - Usługa Gateway nadal działa po odinstalowaniu
summary: Całkowite odinstalowanie OpenClaw (CLI, usługa, stan, przestrzeń robocza)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-06-27T17:44:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Dwie ścieżki:

- **Łatwa ścieżka**, jeśli `openclaw` jest nadal zainstalowany.
- **Ręczne usunięcie usługi**, jeśli CLI zniknęło, ale usługa nadal działa.

## Łatwa ścieżka (CLI nadal zainstalowane)

Zalecane: użyj wbudowanego deinstalatora:

```bash
openclaw uninstall
```

Podczas używania CLI usuwanie stanu zachowuje skonfigurowane katalogi obszarów roboczych, chyba że wybierzesz także `--workspace`.

Podejrzyj, co zostanie usunięte (bezpieczne):

```bash
openclaw uninstall --dry-run --all
```

Nieinteraktywnie (automatyzacja / npx). Używaj ostrożnie i tylko po potwierdzeniu zakresów:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Kroki ręczne (ten sam wynik):

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

Jeśli ustawiono `OPENCLAW_CONFIG_PATH` na niestandardową lokalizację poza katalogiem stanu, usuń także ten plik.
Jeśli chcesz zachować obszar roboczy wewnątrz katalogu stanu, taki jak `~/.openclaw/workspace`, przenieś go w inne miejsce przed uruchomieniem `rm -rf` albo usuń zawartość stanu wybiórczo.

4. Usuń swój obszar roboczy (opcjonalne, usuwa pliki agentów):

```bash
rm -rf ~/.openclaw/workspace
```

5. Usuń instalację CLI (wybierz użyty sposób):

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

- Jeśli używano profili (`--profile` / `OPENCLAW_PROFILE`), powtórz krok 3 dla każdego katalogu stanu (domyślne to `~/.openclaw-<profile>`).
- W trybie zdalnym katalog stanu znajduje się na **hoście Gateway**, więc wykonaj tam także kroki 1-4.

## Ręczne usunięcie usługi (CLI nie jest zainstalowane)

Użyj tego, jeśli usługa Gateway nadal działa, ale brakuje `openclaw`.

### macOS (launchd)

Domyślna etykieta to `ai.openclaw.gateway` (albo `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą nadal istnieć):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jeśli używano profilu, zastąp etykietę i nazwę plist przez `ai.openclaw.<profile>`. Usuń wszystkie starsze pliki plist `com.openclaw.*`, jeśli istnieją.

### Linux (jednostka użytkownika systemd)

Domyślna nazwa jednostki to `openclaw-gateway.service` (albo `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (zaplanowane zadanie)

Domyślna nazwa zadania to `OpenClaw Gateway` (albo `OpenClaw Gateway (<profile>)`).
Skrypt zadania znajduje się w katalogu stanu jako `gateway.cmd`; obecne instalacje mogą
także tworzyć bezokienny program uruchamiający `gateway.vbs`, który Harmonogram zadań uruchamia zamiast
bezpośredniego otwierania `gateway.cmd`.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Jeśli używano profilu, usuń pasującą nazwę zadania oraz pliki `gateway.cmd` /
`gateway.vbs` w `~\.openclaw-<profile>`.

## Normalna instalacja a checkout źródeł

### Normalna instalacja (install.sh / npm / pnpm / bun)

Jeśli użyto `https://openclaw.ai/install.sh` albo `install.ps1`, CLI zostało zainstalowane za pomocą `npm install -g openclaw@latest`.
Usuń je za pomocą `npm rm -g openclaw` (albo `pnpm remove -g` / `bun remove -g`, jeśli zainstalowano je w ten sposób).

### Checkout źródeł (git clone)

Jeśli uruchamiasz z checkoutu repozytorium (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Odinstaluj usługę Gateway **przed** usunięciem repozytorium (użyj łatwej ścieżki powyżej albo ręcznego usunięcia usługi).
2. Usuń katalog repozytorium.
3. Usuń stan i obszar roboczy, jak pokazano powyżej.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Przewodnik migracji](/pl/install/migrating)
