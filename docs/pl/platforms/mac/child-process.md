---
read_when:
    - Integrujesz aplikację Mac z cyklem życia gateway
summary: Cykl życia Gateway na macOS (launchd)
title: Cykl życia Gateway
x-i18n:
    generated_at: "2026-04-05T13:59:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Cykl życia Gateway na macOS

Aplikacja macOS domyślnie **zarządza Gateway przez launchd** i nie uruchamia
Gateway jako procesu potomnego. Najpierw próbuje dołączyć do już działającej
Gateway na skonfigurowanym porcie; jeśli żadna nie jest osiągalna, włącza usługę launchd
przez zewnętrzne CLI `openclaw` (bez osadzonego runtime). Zapewnia to
niezawodny auto-start przy logowaniu i restart po awariach.

Tryb procesu potomnego (Gateway uruchamiana bezpośrednio przez aplikację) **nie jest dziś używany**.
Jeśli potrzebujesz ściślejszego powiązania z UI, uruchom Gateway ręcznie w terminalu.

## Domyślne zachowanie (launchd)

- Aplikacja instaluje LaunchAgent per użytkownik oznaczony etykietą `ai.openclaw.gateway`
  (lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; obsługiwane jest starsze `com.openclaw.*`).
- Gdy tryb Local jest włączony, aplikacja upewnia się, że LaunchAgent jest załadowany i
  uruchamia Gateway w razie potrzeby.
- Logi są zapisywane do ścieżki logu gateway launchd (widocznej w Debug Settings).

Typowe polecenia:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę przez `ai.openclaw.<profile>`, gdy uruchamiasz nazwany profil.

## Niepodpisane buildy deweloperskie

`scripts/restart-mac.sh --no-sign` służy do szybkich lokalnych buildów, gdy nie masz
kluczy podpisywania. Aby launchd nie wskazywał niepodpisanej binarki relay, skrypt:

- zapisuje `~/.openclaw/disable-launchagent`.

Podpisane uruchomienia `scripts/restart-mac.sh` czyszczą to nadpisanie, jeśli znacznik
istnieje. Aby zresetować ręcznie:

```bash
rm ~/.openclaw/disable-launchagent
```

## Tryb tylko dołączania

Aby wymusić, by aplikacja macOS **nigdy nie instalowała ani nie zarządzała launchd**, uruchom ją z
`--attach-only` (lub `--no-launchd`). Ustawia to `~/.openclaw/disable-launchagent`,
więc aplikacja tylko dołącza do już działającej Gateway. To samo
zachowanie można przełączać w Debug Settings.

## Tryb zdalny

Tryb zdalny nigdy nie uruchamia lokalnej Gateway. Aplikacja używa tunelu SSH do
zdalnego hosta i łączy się przez ten tunel.

## Dlaczego preferujemy launchd

- Auto-start przy logowaniu.
- Wbudowana semantyka restartu/KeepAlive.
- Przewidywalne logi i nadzór.

Jeśli kiedyś znów potrzebny będzie prawdziwy tryb procesu potomnego, powinien zostać udokumentowany jako
osobny, jawny tryb tylko dla deweloperów.
