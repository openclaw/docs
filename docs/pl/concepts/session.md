---
read_when:
    - Chcesz zrozumieć trasowanie i izolację sesji
    - Chcesz skonfigurować zakres DM dla konfiguracji wieloużytkownikowych
    - Debugujesz codzienne resetowania sesji lub resetowania sesji po bezczynności
summary: Jak OpenClaw zarządza sesjami konwersacji
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-05-07T13:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizuje konwersacje w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie tego, skąd pochodzi -- DM-y, czaty grupowe, zadania cron itd.

## Jak kierowane są wiadomości

| Źródło          | Zachowanie                  |
| --------------- | --------------------------- |
| Wiadomości bezpośrednie | Domyślnie współdzielona sesja |
| Czaty grupowe   | Izolowana dla każdej grupy  |
| Pokoje/kanały   | Izolowana dla każdego pokoju |
| Zadania cron    | Nowa sesja przy każdym uruchomieniu |
| Webhooks        | Izolowana dla każdego hooka |

## Izolacja DM

Domyślnie wszystkie DM-y współdzielą jedną sesję, aby zachować ciągłość. Jest to odpowiednie dla
konfiguracji z jednym użytkownikiem.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do Twojego agenta, włącz izolację DM. Bez niej wszyscy
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

- `main` (domyślne) -- wszystkie DM-y współdzielą jedną sesję.
- `per-peer` -- izolacja według nadawcy (między kanałami).
- `per-channel-peer` -- izolacja według kanału + nadawcy (zalecane).
- `per-account-channel-peer` -- izolacja według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z Tobą z wielu kanałów, użyj
`session.identityLinks`, aby połączyć jej tożsamości, tak by współdzieliły jedną sesję.
</Tip>

### Dokowanie połączonych kanałów

Polecenia dokowania pozwalają użytkownikowi przenieść trasę odpowiedzi bieżącej sesji czatu bezpośredniego do
innego połączonego kanału bez uruchamiania nowej sesji. Zobacz
[Dokowanie kanałów](/pl/concepts/channel-docking), aby znaleźć przykłady, konfigurację i
rozwiązywanie problemów.

Zweryfikuj konfigurację poleceniem `openclaw security audit`.

## Cykl życia sesji

Sesje są używane ponownie do czasu wygaśnięcia:

- **Codzienny reset** (domyślnie) -- nowa sesja o 4:00 czasu lokalnego na hoście Gateway. Codzienna świeżość jest oparta na momencie rozpoczęcia bieżącego `sessionId`, a nie na
  późniejszych zapisach metadanych.
- **Reset bezczynności** (opcjonalny) -- nowa sesja po okresie braku aktywności. Ustaw
  `session.reset.idleMinutes`. Świeżość bezczynności jest oparta na ostatniej rzeczywistej
  interakcji użytkownika/kanału, więc zdarzenia systemowe heartbeat, cron i exec nie
  utrzymują sesji przy życiu.
- **Ręczny reset** -- wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowane są jednocześnie resety codzienne i bezczynności, wygrywa ten, który wygaśnie pierwszy.
Tury Heartbeat, cron, exec i innych zdarzeń systemowych mogą zapisywać metadane sesji,
ale te zapisy nie przedłużają świeżości resetu codziennego ani resetu bezczynności. Gdy reset
przewija sesję, zakolejkowane powiadomienia zdarzeń systemowych dla starej sesji są
odrzucane, aby nieaktualne aktualizacje w tle nie zostały dodane przed pierwszym promptem w
nowej sesji.

Sesje z aktywną sesją CLI należącą do dostawcy nie są odcinane przez domyślny
codzienny mechanizm implicit. Użyj `/reset` lub skonfiguruj jawnie `session.reset`, gdy takie
sesje powinny wygasać według harmonogramu.

## Gdzie znajduje się stan

Cały stan sesji jest własnością **Gateway**. Klienty UI odpytują Gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypty:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` przechowuje osobne znaczniki czasu cyklu życia:

- `sessionStartedAt`: kiedy rozpoczął się bieżący `sessionId`; używa tego codzienny reset.
- `lastInteractionAt`: ostatnia interakcja użytkownika/kanału, która przedłuża czas życia bezczynności.
- `updatedAt`: ostatnia mutacja wiersza magazynu; przydatne do listowania i przycinania, ale nie
  autorytatywne dla świeżości resetu codziennego/bezczynności.

Starsze wiersze bez `sessionStartedAt` są rozwiązywane z nagłówka sesji JSONL
transkryptu, gdy jest dostępny. Jeśli starszy wiersz nie ma również `lastInteractionAt`,
świeżość bezczynności wraca do czasu rozpoczęcia tej sesji, a nie do późniejszych
zapisów porządkowych.

## Utrzymanie sesji

OpenClaw automatycznie ogranicza rozmiar magazynu sesji w czasie. Domyślnie działa
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

Dla produkcyjnych limitów `maxEntries` zapisy środowiska uruchomieniowego Gateway używają małego bufora wysokiego poziomu i czyszczą wpisy partiami do skonfigurowanego limitu. Odczyty magazynu sesji nie przycinają ani nie ograniczają wpisów podczas startu Gateway. Pozwala to uniknąć pełnego czyszczenia magazynu przy każdym uruchomieniu lub izolowanej sesji cron. `openclaw sessions cleanup --enforce` stosuje limit natychmiast.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki konwersacji, w tym sesje grupowe
i sesje czatu ograniczone do wątków, jednocześnie pozwalając syntetycznym wpisom cron,
hook, Heartbeat, ACP i podagentów starzeć się i znikać.

Jeśli wcześniej używano izolacji wiadomości bezpośrednich, a później przywrócono
`session.dmScope` do `main`, podejrzyj nieaktualne wiersze DM kluczowane peerem za pomocą
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Zastosowanie tej samej flagi
wycofuje te stare bezpośrednie wiersze DM i zachowuje ich transkrypty jako usunięte
archiwa.

Podejrzyj za pomocą `openclaw sessions cleanup --dry-run`.

## Sprawdzanie sesji

- `openclaw status` -- ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` -- wszystkie sesje (filtruj za pomocą `--active <minutes>`).
- `/status` na czacie -- użycie kontekstu, model i przełączniki.
- `/context list` -- co znajduje się w prompcie systemowym.

## Dalsza lektura

- [Przycinanie sesji](/pl/concepts/session-pruning) -- skracanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) -- podsumowywanie długich konwersacji
- [Narzędzia sesji](/pl/concepts/session-tool) -- narzędzia agenta do pracy między sesjami
- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction) --
  schemat magazynu, transkrypty, polityka wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Wielu agentów](/pl/concepts/multi-agent) — routing i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak odłączona praca tworzy rekordy zadań z odwołaniami do sesji
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji

## Powiązane

- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
