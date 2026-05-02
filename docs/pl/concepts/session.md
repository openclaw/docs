---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres DM dla konfiguracji wieloużytkownikowych
    - Diagnozujesz codzienne resetowanie sesji lub resetowanie sesji po bezczynności
summary: Jak OpenClaw zarządza sesjami konwersacji
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-05-02T09:49:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizuje konwersacje w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie miejsca, z którego pochodzi -- wiadomości prywatnych, czatów grupowych, zadań cron itd.

## Jak kierowane są wiadomości

| Źródło             | Zachowanie                            |
| ------------------ | ------------------------------------- |
| Wiadomości prywatne | Domyślnie współdzielona sesja         |
| Czaty grupowe      | Izolowane dla każdej grupy            |
| Pokoje/kanały      | Izolowane dla każdego pokoju          |
| Zadania Cron       | Nowa sesja dla każdego uruchomienia   |
| Webhooki           | Izolowane dla każdego hooka           |

## Izolacja wiadomości prywatnych

Domyślnie wszystkie wiadomości prywatne współdzielą jedną sesję dla zachowania ciągłości. To wystarcza w
konfiguracjach dla jednego użytkownika.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do Twojego agenta, włącz izolację wiadomości prywatnych. Bez niej wszyscy
użytkownicy współdzielą ten sam kontekst konwersacji -- prywatne wiadomości Alicji byłyby
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

- `main` (domyślne) -- wszystkie wiadomości prywatne współdzielą jedną sesję.
- `per-peer` -- izoluj według nadawcy (między kanałami).
- `per-channel-peer` -- izoluj według kanału + nadawcy (zalecane).
- `per-account-channel-peer` -- izoluj według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z Tobą z wielu kanałów, użyj
`session.identityLinks`, aby połączyć jej tożsamości, tak aby współdzieliły jedną sesję.
</Tip>

### Dokowanie połączonych kanałów

Polecenia dokowania pozwalają użytkownikowi przenieść trasę odpowiedzi bieżącej sesji czatu bezpośredniego do
innego połączonego kanału bez rozpoczynania nowej sesji. Zobacz
[Dokowanie kanałów](/pl/concepts/channel-docking), aby znaleźć przykłady, konfigurację i
rozwiązywanie problemów.

Zweryfikuj swoją konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są używane ponownie, dopóki nie wygasną:

- **Reset dzienny** (domyślny) -- nowa sesja o 4:00 rano czasu lokalnego na hoście
  Gateway. Świeżość dzienna jest oparta na momencie rozpoczęcia bieżącego `sessionId`, a nie
  na późniejszych zapisach metadanych.
- **Reset bezczynności** (opcjonalny) -- nowa sesja po okresie braku aktywności. Ustaw
  `session.reset.idleMinutes`. Świeżość bezczynności jest oparta na ostatniej rzeczywistej
  interakcji użytkownika/kanału, więc zdarzenia systemowe heartbeat, cron i exec nie
  utrzymują sesji przy życiu.
- **Reset ręczny** -- wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowane są zarówno reset dzienny, jak i reset bezczynności, wygrywa ten, który wygaśnie pierwszy.
Tury heartbeat, cron, exec i innych zdarzeń systemowych mogą zapisywać metadane sesji,
ale te zapisy nie wydłużają świeżości resetu dziennego ani resetu bezczynności. Gdy reset
przełącza sesję, oczekujące powiadomienia zdarzeń systemowych dla starej sesji są
odrzucane, aby nieaktualne aktualizacje w tle nie były dodawane przed pierwszym promptem w
nowej sesji.

Sesje z aktywną sesją CLI należącą do dostawcy nie są przerywane przez domyślny niejawny
reset dzienny. Użyj `/reset` lub skonfiguruj jawnie `session.reset`, gdy te
sesje mają wygasać według timera.

## Gdzie znajduje się stan

Cały stan sesji należy do **Gateway**. Klienci UI odpytują Gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypcje:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` przechowuje osobne znaczniki czasu cyklu życia:

- `sessionStartedAt`: kiedy rozpoczął się bieżący `sessionId`; reset dzienny używa tej wartości.
- `lastInteractionAt`: ostatnia interakcja użytkownika/kanału, która wydłuża czas życia bezczynności.
- `updatedAt`: ostatnia mutacja wiersza magazynu; przydatna do listowania i przycinania, ale nie
  jest autorytatywna dla świeżości resetu dziennego/bezczynności.

Starsze wiersze bez `sessionStartedAt` są rozwiązywane z nagłówka sesji w transkrypcji JSONL,
gdy jest dostępny. Jeśli starszy wiersz nie ma także `lastInteractionAt`,
świeżość bezczynności używa czasu rozpoczęcia tej sesji, a nie późniejszych zapisów
porządkowych.

## Utrzymanie sesji

OpenClaw automatycznie ogranicza rozmiar magazynu sesji w czasie. Domyślnie działa
w trybie `warn` (zgłasza, co zostałoby wyczyszczone). Ustaw `session.maintenance.mode`
na `"enforce"` dla automatycznego czyszczenia:

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

Dla produkcyjnych limitów `maxEntries` zapisy środowiska wykonawczego Gateway używają małego bufora górnego progu i czyszczą partiami z powrotem do skonfigurowanego limitu. Odczyty magazynu sesji nie przycinają ani nie ograniczają wpisów podczas uruchamiania Gateway. Pozwala to uniknąć pełnego czyszczenia magazynu przy każdym uruchomieniu lub izolowanej sesji cron. `openclaw sessions cleanup --enforce` stosuje limit natychmiast.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki konwersacji, w tym sesje grupowe
i sesje czatu o zakresie wątku, jednocześnie pozwalając starzeć się syntetycznym wpisom cron,
hook, heartbeat, ACP i podagentów.

Podejrzyj za pomocą `openclaw sessions cleanup --dry-run`.

## Inspekcja sesji

- `openclaw status` -- ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` -- wszystkie sesje (filtruj za pomocą `--active <minutes>`).
- `/status` na czacie -- użycie kontekstu, model i przełączniki.
- `/context list` -- co znajduje się w prompcie systemowym.

## Dalsza lektura

- [Przycinanie sesji](/pl/concepts/session-pruning) -- skracanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) -- podsumowywanie długich konwersacji
- [Narzędzia sesji](/pl/concepts/session-tool) -- narzędzia agenta do pracy między sesjami
- [Dogłębne omówienie zarządzania sesjami](/pl/reference/session-management-compaction) --
  schemat magazynu, transkrypcje, polityka wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Wielu agentów](/pl/concepts/multi-agent) — kierowanie i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak odłączona praca tworzy rekordy zadań z odwołaniami do sesji
- [Kierowanie kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji

## Powiązane

- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
