---
read_when:
    - Chcesz TUI dla Gateway (przyjazny dla pracy zdalnej)
    - Chcesz przekazywać `url`/`token`/`session` ze skryptów.
    - Chcesz uruchomić TUI w lokalnym trybie osadzonym bez Gateway.
    - Chcesz używać `openclaw chat` albo `openclaw tui --local`
summary: Dokumentacja CLI dla `openclaw tui` (TUI oparty na Gateway lub lokalny osadzony)
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Otwórz terminalowy interfejs użytkownika połączony z Gateway albo uruchom go w lokalnym trybie osadzonym.

Powiązane:

- Przewodnik po TUI: [TUI](/pl/web/tui)

Uwagi:

- `chat` i `terminal` to aliasy dla `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- `tui` w miarę możliwości rozwiązuje skonfigurowane SecretRef uwierzytelniania gateway dla uwierzytelniania tokenem/hasłem (`env`/`file`/`exec` providers).
- Po uruchomieniu z wnętrza skonfigurowanego katalogu workspace agenta TUI automatycznie wybiera tego agenta jako domyślne źródło klucza sesji (chyba że `--session` jest jawnie ustawione na `agent:<id>:...`).
- Tryb lokalny używa bezpośrednio osadzonego środowiska wykonawczego agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne tylko w Gateway są niedostępne.
- Tryb lokalny dodaje `/auth [provider]` do powierzchni poleceń w TUI.
- Bramki zatwierdzania Pluginów nadal obowiązują w trybie lokalnym. Narzędzia wymagające zatwierdzenia wyświetlają monit o decyzję w terminalu; nic nie jest automatycznie zatwierdzane po cichu, ponieważ Gateway nie bierze w tym udziału.

## Przykłady

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Pętla naprawy konfiguracji

Użyj trybu lokalnego, gdy bieżąca konfiguracja jest już poprawna i chcesz, aby osadzony agent ją sprawdził, porównał z dokumentacją i pomógł naprawić ją z tego samego terminala:

Jeśli `openclaw config validate` już zgłasza błędy, najpierw użyj `openclaw configure` albo
`openclaw doctor --fix`. `openclaw chat` nie omija blokady niepoprawnej konfiguracji.

```bash
openclaw chat
```

Następnie wewnątrz TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Stosuj ukierunkowane poprawki za pomocą `openclaw config set` albo `openclaw configure`, a następnie
uruchom ponownie `openclaw config validate`. Zobacz [TUI](/pl/web/tui) i [Config](/pl/cli/config).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [TUI](/pl/web/tui)
