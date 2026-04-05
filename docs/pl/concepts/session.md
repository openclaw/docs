---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres DM dla środowisk wieloużytkownikowych
summary: Jak OpenClaw zarządza sesjami rozmów
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-04-05T13:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Zarządzanie sesjami

OpenClaw organizuje rozmowy w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie tego, skąd pochodzi — DM, czaty grupowe, zadania cron itd.

## Jak kierowane są wiadomości

| Źródło          | Zachowanie                |
| --------------- | ------------------------- |
| Wiadomości bezpośrednie | Domyślnie współdzielona sesja |
| Czaty grupowe   | Izolowane per grupa       |
| Pokoje/kanały   | Izolowane per pokój       |
| Zadania cron    | Nowa sesja dla każdego uruchomienia |
| Webhooki        | Izolowane per hook        |

## Izolacja DM

Domyślnie wszystkie DM współdzielą jedną sesję dla zachowania ciągłości. To jest w porządku w
środowiskach dla jednego użytkownika.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do Twojego agenta, włącz izolację DM. Bez niej wszyscy
użytkownicy współdzielą ten sam kontekst rozmowy — prywatne wiadomości Alicji byłyby widoczne dla Boba.
</Warning>

**Rozwiązanie:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // izolacja według kanału + nadawcy
  },
}
```

Inne opcje:

- `main` (domyślnie) — wszystkie DM współdzielą jedną sesję.
- `per-peer` — izolacja według nadawcy (między kanałami).
- `per-channel-peer` — izolacja według kanału + nadawcy (zalecane).
- `per-account-channel-peer` — izolacja według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z Tobą z wielu kanałów, użyj
`session.identityLinks`, aby połączyć jej tożsamości, tak aby współdzieliła jedną sesję.
</Tip>

Zweryfikuj konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są ponownie używane, dopóki nie wygasną:

- **Codzienny reset** (domyślnie) — nowa sesja o 4:00 czasu lokalnego na hoście
  gateway.
- **Reset po bezczynności** (opcjonalny) — nowa sesja po okresie braku aktywności. Ustaw
  `session.reset.idleMinutes`.
- **Reset ręczny** — wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowane są jednocześnie codzienne i bezczynnościowe resety, wygrywa ten, który wygaśnie wcześniej.

## Gdzie przechowywany jest stan

Cały stan sesji należy do **gateway**. Klienci UI wysyłają zapytania do gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypcje:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Utrzymanie sesji

OpenClaw automatycznie ogranicza rozmiar przechowywanych danych sesji w czasie. Domyślnie działa
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

Podgląd za pomocą `openclaw sessions cleanup --dry-run`.

## Inspekcja sesji

- `openclaw status` — ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` — wszystkie sesje (filtruj za pomocą `--active <minutes>`).
- `/status` na czacie — użycie kontekstu, model i przełączniki.
- `/context list` — co znajduje się w prompcie systemowym.

## Dalsza lektura

- [Przycinanie sesji](/concepts/session-pruning) — skracanie wyników narzędzi
- [Kompaktowanie](/concepts/compaction) — podsumowywanie długich rozmów
- [Narzędzia sesji](/concepts/session-tool) — narzędzia agenta do pracy między sesjami
- [Dogłębne omówienie zarządzania sesjami](/reference/session-management-compaction) —
  schemat magazynu, transkrypcje, polityka wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Multi-Agent](/concepts/multi-agent) — routing i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak praca odłączona tworzy rekordy zadań z odniesieniami do sesji
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji
