---
read_when:
    - Integracja aplikacji mac z cyklem życia Gateway
summary: Cykl życia Gateway na macOS (launchd)
title: Cykl życia Gateway
x-i18n:
    generated_at: "2026-04-24T09:20:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Cykl życia Gateway na macOS

Aplikacja macOS **domyślnie zarządza Gateway przez launchd** i nie uruchamia
Gateway jako procesu potomnego. Najpierw próbuje dołączyć do już działającego
Gateway na skonfigurowanym porcie; jeśli żaden nie jest osiągalny, włącza usługę launchd
przez zewnętrzne CLI `openclaw` (bez osadzonego runtime). Daje to
niezawodny auto-start przy logowaniu i restart po awariach.

Tryb procesu potomnego (Gateway uruchamiany bezpośrednio przez aplikację) **nie jest dziś używany**.
Jeśli potrzebujesz ciaśniejszego powiązania z interfejsem, uruchom Gateway ręcznie w terminalu.

## Domyślne zachowanie (launchd)

- Aplikacja instaluje per-user LaunchAgent o etykiecie `ai.openclaw.gateway`
  (albo `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` są obsługiwane).
- Gdy tryb Local jest włączony, aplikacja upewnia się, że LaunchAgent jest załadowany i
  uruchamia Gateway, jeśli to potrzebne.
- Logi są zapisywane do ścieżki logu launchd gateway (widocznej w Debug Settings).

Typowe polecenia:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę przez `ai.openclaw.<profile>`, gdy uruchamiasz nazwany profil.

## Niepodpisane buildy deweloperskie

`scripts/restart-mac.sh --no-sign` służy do szybkich lokalnych buildów, gdy nie masz
kluczy podpisywania. Aby zapobiec temu, by launchd wskazywał na niepodpisany binarny relay, skrypt:

- zapisuje `~/.openclaw/disable-launchagent`.

Podpisane uruchomienia `scripts/restart-mac.sh` usuwają to nadpisanie, jeśli znacznik
istnieje. Aby zresetować ręcznie:

```bash
rm ~/.openclaw/disable-launchagent
```

## Tryb tylko-dołączania

Aby wymusić, by aplikacja macOS **nigdy nie instalowała ani nie zarządzała launchd**, uruchom ją z
`--attach-only` (albo `--no-launchd`). To ustawia `~/.openclaw/disable-launchagent`,
więc aplikacja tylko dołącza do już działającego Gateway. To samo
zachowanie możesz przełączyć w Debug Settings.

## Tryb Remote

Tryb Remote nigdy nie uruchamia lokalnego Gateway. Aplikacja używa tunelu SSH do
zdalnego hosta i łączy się przez ten tunel.

## Dlaczego preferujemy launchd

- Auto-start przy logowaniu.
- Wbudowana semantyka restartu/KeepAlive.
- Przewidywalne logi i nadzór.

Jeśli kiedyś znowu potrzebny będzie prawdziwy tryb procesu potomnego, powinien zostać udokumentowany jako
oddzielny, jawny tryb tylko deweloperski.

## Powiązane

- [macOS app](/pl/platforms/macos)
- [Gateway runbook](/pl/gateway)
