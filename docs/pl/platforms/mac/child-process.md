---
read_when:
    - Integracja aplikacji na Maca z cyklem życia Gateway
summary: Cykl życia Gateway w systemie macOS (launchd)
title: Cykl życia Gateway na macOS
x-i18n:
    generated_at: "2026-05-06T09:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Aplikacja macOS domyślnie **zarządza Gateway przez launchd** i nie uruchamia
Gateway jako procesu potomnego. Najpierw próbuje dołączyć do już działającego
Gateway na skonfigurowanym porcie; jeśli żaden nie jest osiągalny, włącza usługę
launchd przez zewnętrzne CLI `openclaw` (bez osadzonego środowiska uruchomieniowego). Zapewnia to
niezawodne automatyczne uruchamianie przy logowaniu i restart po awariach.

Tryb procesu potomnego (Gateway uruchamiany bezpośrednio przez aplikację) **nie jest dziś używany**.
Jeśli potrzebujesz ściślejszego powiązania z UI, uruchom Gateway ręcznie w terminalu.

## Domyślne zachowanie (launchd)

- Aplikacja instaluje LaunchAgent dla użytkownika z etykietą `ai.openclaw.gateway`
  (lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` jest obsługiwane).
- Gdy włączony jest tryb lokalny, aplikacja upewnia się, że LaunchAgent jest załadowany, i
  uruchamia Gateway w razie potrzeby.
- Logi są zapisywane w ścieżce logów gateway launchd (widocznej w ustawieniach debugowania).

Typowe polecenia:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę `ai.openclaw.<profile>`, gdy uruchamiasz nazwany profil.

## Niepodpisane kompilacje deweloperskie

`scripts/restart-mac.sh --no-sign` służy do szybkich lokalnych kompilacji, gdy nie masz
kluczy podpisujących. Aby zapobiec wskazywaniu przez launchd na niepodpisany plik binarny przekaźnika, skrypt:

- Zapisuje `~/.openclaw/disable-launchagent`.

Podpisane uruchomienia `scripts/restart-mac.sh` usuwają to nadpisanie, jeśli znacznik jest
obecny. Aby zresetować ręcznie:

```bash
rm ~/.openclaw/disable-launchagent
```

## Tryb tylko dołączania

Aby wymusić, by aplikacja macOS **nigdy nie instalowała ani nie zarządzała launchd**, uruchom ją z
`--attach-only` (lub `--no-launchd`). Ustawia to `~/.openclaw/disable-launchagent`,
więc aplikacja tylko dołącza do już działającego Gateway. To samo
zachowanie możesz przełączyć w ustawieniach debugowania.

## Tryb zdalny

Tryb zdalny nigdy nie uruchamia lokalnego Gateway. Aplikacja używa tunelu SSH do
zdalnego hosta i łączy się przez ten tunel.

## Dlaczego preferujemy launchd

- Automatyczne uruchamianie przy logowaniu.
- Wbudowana semantyka restartu/KeepAlive.
- Przewidywalne logi i nadzór.

Jeśli prawdziwy tryb procesu potomnego będzie kiedykolwiek ponownie potrzebny, powinien zostać udokumentowany jako
oddzielny, jawny tryb wyłącznie deweloperski.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Runbook Gateway](/pl/gateway)
