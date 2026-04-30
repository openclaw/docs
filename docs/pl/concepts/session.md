---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres wiadomości bezpośrednich dla konfiguracji wieloużytkownikowych
    - Diagnozujesz codzienne resetowanie sesji lub resetowanie po bezczynności
summary: Jak OpenClaw zarządza sesjami konwersacji
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-04-30T09:50:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizuje rozmowy w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie miejsca, z którego pochodzi -- wiadomości prywatnych, czatów grupowych, zadań Cron itd.

## Jak kierowane są wiadomości

| Źródło              | Zachowanie                    |
| ------------------- | ----------------------------- |
| Wiadomości prywatne | Domyślnie sesja współdzielona |
| Czaty grupowe       | Izolowana dla każdej grupy    |
| Pokoje/kanały       | Izolowana dla każdego pokoju  |
| Zadania Cron        | Nowa sesja dla każdego uruchomienia |
| Webhooki            | Izolowana dla każdego hooka   |

## Izolacja wiadomości prywatnych

Domyślnie wszystkie wiadomości prywatne współdzielą jedną sesję dla zachowania ciągłości. To wystarcza w
konfiguracjach dla jednego użytkownika.

<Warning>
Jeśli kilka osób może wysyłać wiadomości do twojego agenta, włącz izolację wiadomości prywatnych. Bez niej wszyscy
użytkownicy współdzielą ten sam kontekst rozmowy -- prywatne wiadomości Alice byłyby
widoczne dla Boba.
</Warning>

**Rozwiązanie:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Inne opcje:

- `main` (domyślnie) -- wszystkie wiadomości prywatne współdzielą jedną sesję.
- `per-peer` -- izolacja według nadawcy (między kanałami).
- `per-channel-peer` -- izolacja według kanału + nadawcy (zalecane).
- `per-account-channel-peer` -- izolacja według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z tobą z wielu kanałów, użyj
`session.identityLinks`, aby połączyć jej tożsamości, tak by współdzieliły jedną sesję.
</Tip>

### Dokowanie połączonych kanałów

Polecenia dokowania pozwalają użytkownikowi przenieść trasę odpowiedzi bieżącej sesji czatu bezpośredniego do
innego połączonego kanału bez rozpoczynania nowej sesji. Zobacz
[Dokowanie kanałów](/pl/concepts/channel-docking), aby znaleźć przykłady, konfigurację i
rozwiązywanie problemów.

Zweryfikuj konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są ponownie używane do czasu wygaśnięcia:

- **Reset dzienny** (domyślnie) -- nowa sesja o 4:00 czasu lokalnego na hoście
  Gateway. Dzienna świeżość jest oparta na momencie rozpoczęcia bieżącego `sessionId`, a nie
  na późniejszych zapisach metadanych.
- **Reset po bezczynności** (opcjonalnie) -- nowa sesja po okresie bezczynności. Ustaw
  `session.reset.idleMinutes`. Świeżość bezczynności jest oparta na ostatniej rzeczywistej
  interakcji użytkownika/kanału, więc zdarzenia systemowe Heartbeat, Cron i exec nie
  utrzymują sesji przy życiu.
- **Reset ręczny** -- wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowane są zarówno reset dzienny, jak i reset po bezczynności, obowiązuje ten, który wygaśnie pierwszy.
Tury zdarzeń systemowych Heartbeat, Cron, exec i innych mogą zapisywać metadane sesji,
ale te zapisy nie przedłużają świeżości resetu dziennego ani resetu po bezczynności. Gdy reset
przenosi sesję, oczekujące powiadomienia zdarzeń systemowych dla starej sesji są
odrzucane, aby nieaktualne aktualizacje w tle nie zostały dodane na początku pierwszego promptu w
nowej sesji.

Sesje z aktywną sesją CLI należącą do dostawcy nie są przecinane przez domyślny niejawny
reset dzienny. Użyj `/reset` lub jawnie skonfiguruj `session.reset`, gdy te
sesje powinny wygasać według timera.

## Gdzie znajduje się stan

Cały stan sesji należy do **Gateway**. Klienty UI odpytują Gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypty:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` przechowuje oddzielne znaczniki czasu cyklu życia:

- `sessionStartedAt`: moment rozpoczęcia bieżącego `sessionId`; używany przez reset dzienny.
- `lastInteractionAt`: ostatnia interakcja użytkownika/kanału, która przedłuża czas życia bezczynności.
- `updatedAt`: ostatnia mutacja wiersza magazynu; przydatna do listowania i czyszczenia, ale nie
  autorytatywna dla świeżości resetu dziennego/po bezczynności.

Starsze wiersze bez `sessionStartedAt` są rozstrzygane z nagłówka sesji JSONL
transkryptu, gdy jest dostępny. Jeśli starszy wiersz nie ma również `lastInteractionAt`,
świeżość bezczynności używa tego czasu rozpoczęcia sesji, a nie późniejszych zapisów
porządkowych.

## Utrzymanie sesji

OpenClaw automatycznie ogranicza magazyn sesji w czasie. Domyślnie działa
w trybie `warn` (raportuje, co zostałoby wyczyszczone). Ustaw `session.maintenance.mode`
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

Dla produkcyjnych limitów `maxEntries` zapisy środowiska uruchomieniowego Gateway używają małego bufora górnego progu i czyszczą partiami z powrotem do skonfigurowanego limitu. Pozwala to uniknąć pełnego czyszczenia magazynu przy każdej izolowanej sesji Cron. `openclaw sessions cleanup --enforce` stosuje limit natychmiast.

Podgląd za pomocą `openclaw sessions cleanup --dry-run`.

## Inspekcja sesji

- `openclaw status` -- ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` -- wszystkie sesje (filtruj za pomocą `--active <minutes>`).
- `/status` na czacie -- użycie kontekstu, model i przełączniki.
- `/context list` -- zawartość promptu systemowego.

## Dalsza lektura

- [Przycinanie sesji](/pl/concepts/session-pruning) -- skracanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) -- podsumowywanie długich rozmów
- [Narzędzia sesji](/pl/concepts/session-tool) -- narzędzia agenta do pracy między sesjami
- [Dogłębne omówienie zarządzania sesjami](/pl/reference/session-management-compaction) --
  schemat magazynu, transkrypty, polityka wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Wielu agentów](/pl/concepts/multi-agent) — kierowanie i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak odłączona praca tworzy rekordy zadań z odwołaniami do sesji
- [Kierowanie kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji

## Powiązane

- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
