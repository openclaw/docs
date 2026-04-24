---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres wiadomości prywatnych dla konfiguracji wieloużytkownikowych
summary: Jak OpenClaw zarządza sesjami rozmów
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-04-24T09:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organizuje rozmowy w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie miejsca, z którego pochodzi — wiadomości prywatnych, czatów grupowych, zadań Cron itd.

## Jak kierowane są wiadomości

| Source          | Behavior                  |
| --------------- | ------------------------- |
| Wiadomości prywatne | Współdzielona sesja domyślnie |
| Czaty grupowe   | Izolowane per grupa       |
| Pokoje/kanały   | Izolowane per pokój       |
| Zadania Cron    | Nowa sesja dla każdego uruchomienia |
| Webhooki        | Izolowane per Hook        |

## Izolacja wiadomości prywatnych

Domyślnie wszystkie wiadomości prywatne współdzielą jedną sesję dla zachowania
ciągłości. To jest w porządku dla konfiguracji jednoosobowych.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do twojego agenta, włącz izolację wiadomości prywatnych. Bez tego wszyscy
użytkownicy współdzielą ten sam kontekst rozmowy — prywatne wiadomości Alice byłyby widoczne dla Boba.
</Warning>

**Naprawa:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // izolacja według kanału + nadawcy
  },
}
```

Inne opcje:

- `main` (domyślnie) — wszystkie wiadomości prywatne współdzielą jedną sesję.
- `per-peer` — izolacja według nadawcy (między kanałami).
- `per-channel-peer` — izolacja według kanału + nadawcy (zalecane).
- `per-account-channel-peer` — izolacja według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z tobą z wielu kanałów, użyj
`session.identityLinks`, aby powiązać jej tożsamości, tak by współdzieliła jedną sesję.
</Tip>

Zweryfikuj konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są używane ponownie, dopóki nie wygasną:

- **Codzienny reset** (domyślnie) — nowa sesja o 4:00 czasu lokalnego na hoście
  Gateway.
- **Reset po bezczynności** (opcjonalnie) — nowa sesja po okresie bezczynności. Ustaw
  `session.reset.idleMinutes`.
- **Reset ręczny** — wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowano zarówno codzienny reset, jak i reset po bezczynności, wygrywa to, co wygaśnie wcześniej.

Sesje z aktywną sesją CLI należącą do dostawcy nie są przecinane przez domyślny
niejawny dzienny reset. Użyj `/reset` albo skonfiguruj `session.reset` jawnie, gdy takie
sesje mają wygasać według timera.

## Gdzie znajduje się stan

Cały stan sesji jest własnością **gateway**. Klienci UI odpytują gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypty:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Utrzymanie sesji

OpenClaw automatycznie ogranicza rozmiar magazynu sesji z upływem czasu. Domyślnie działa
w trybie `warn` (zgłasza, co zostałoby wyczyszczone). Ustaw `session.maintenance.mode`
na `"enforce"`, aby włączyć automatyczne czyszczenie:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Podejrzyj działanie przez `openclaw sessions cleanup --dry-run`.

## Sprawdzanie sesji

- `openclaw status` — ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` — wszystkie sesje (filtrowanie przez `--active <minutes>`).
- `/status` na czacie — użycie kontekstu, model i przełączniki.
- `/context list` — co znajduje się w prompcie systemowym.

## Dalsza lektura

- [Przycinanie sesji](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Narzędzia sesji](/pl/concepts/session-tool) — narzędzia agenta do pracy między sesjami
- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction) --
  schemat magazynu, transkrypty, polityka wysyłania, metadane pochodzenia i konfiguracja zaawansowana
- [Multi-Agent](/pl/concepts/multi-agent) — routing i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak odłączona praca tworzy rekordy zadań z odwołaniami do sesji
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji

## Powiązane

- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
