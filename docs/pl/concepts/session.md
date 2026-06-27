---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres DM dla konfiguracji z wieloma użytkownikami
    - Debugujesz codzienne resetowanie sesji lub resetowanie sesji po okresie bezczynności
summary: Jak OpenClaw zarządza sesjami konwersacji
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-06-27T17:29:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organizuje konwersacje w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie miejsca, z którego pochodzi -- wiadomości prywatnych, czatów grupowych, zadań Cron itd.

## Jak kierowane są wiadomości

| Źródło             | Zachowanie                  |
| ------------------ | --------------------------- |
| Wiadomości prywatne | Domyślnie współdzielona sesja |
| Czaty grupowe      | Izolowana dla każdej grupy  |
| Pokoje/kanały      | Izolowana dla każdego pokoju |
| Zadania Cron       | Nowa sesja dla każdego uruchomienia |
| Webhooki           | Izolowana dla każdego hooka |

## Izolacja wiadomości prywatnych

Domyślnie wszystkie wiadomości prywatne współdzielą jedną sesję dla zachowania ciągłości. To jest odpowiednie dla
konfiguracji z jednym użytkownikiem.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do Twojego agenta, włącz izolację wiadomości prywatnych. Bez niej wszyscy
użytkownicy współdzielą ten sam kontekst konwersacji -- prywatne wiadomości Alice byłyby
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
- `per-peer` -- izolacja według nadawcy (między kanałami).
- `per-channel-peer` -- izolacja według kanału + nadawcy (zalecane).
- `per-account-channel-peer` -- izolacja według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z Tobą z wielu kanałów, użyj
`session.identityLinks`, aby połączyć jej tożsamości, tak by współdzieliły jedną sesję.
</Tip>

### Dokowanie połączonych kanałów

Polecenia dokowania pozwalają użytkownikowi przenieść trasę odpowiedzi bieżącej sesji czatu bezpośredniego do
innego połączonego kanału bez rozpoczynania nowej sesji. Zobacz
[Dokowanie kanałów](/pl/concepts/channel-docking), aby poznać przykłady, konfigurację i
rozwiązywanie problemów.

Zweryfikuj konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są ponownie używane do momentu wygaśnięcia:

- **Codzienny reset** (domyślny) -- nowa sesja o 4:00 czasu lokalnego na hoście
  Gateway. Codzienna świeżość jest oparta na tym, kiedy bieżący `sessionId` został uruchomiony, a nie
  na późniejszych zapisach metadanych.
- **Reset bezczynności** (opcjonalny) -- nowa sesja po okresie braku aktywności. Ustaw
  `session.reset.idleMinutes`. Świeżość bezczynności jest oparta na ostatniej rzeczywistej
  interakcji użytkownika/kanału, więc zdarzenia systemowe Heartbeat, Cron i exec nie
  utrzymują sesji przy życiu.
- **Reset ręczny** -- wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowane są zarówno reset codzienny, jak i reset bezczynności, wygrywa ten, który wygaśnie jako pierwszy.
Tury zdarzeń systemowych Heartbeat, Cron, exec i inne mogą zapisywać metadane sesji,
ale te zapisy nie przedłużają świeżości resetu codziennego ani resetu bezczynności. Gdy reset
przenosi sesję, oczekujące powiadomienia zdarzeń systemowych dla starej sesji są
odrzucane, aby nieaktualne aktualizacje w tle nie były dodawane przed pierwszym promptem w
nowej sesji.

Sesje z aktywną sesją CLI należącą do providera nie są odcinane przez domyślny niejawny
reset dzienny. Użyj `/reset` albo skonfiguruj jawnie `session.reset`, gdy te
sesje powinny wygasać według timera.

## Gdzie przechowywany jest stan

Cały stan sesji należy do **Gateway**. Klienci UI odpytują Gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypty:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` przechowuje oddzielne znaczniki czasu cyklu życia:

- `sessionStartedAt`: kiedy rozpoczął się bieżący `sessionId`; reset codzienny używa tej wartości.
- `lastInteractionAt`: ostatnia interakcja użytkownika/kanału, która przedłuża czas życia bezczynności.
- `updatedAt`: ostatnia mutacja wiersza magazynu; przydatne do wyświetlania i przycinania, ale nie
  autorytatywne dla świeżości resetu codziennego/bezczynności.

Starsze wiersze bez `sessionStartedAt` są rozwiązywane z nagłówka sesji JSONL
transkryptu, jeśli jest dostępny. Jeśli starszy wiersz nie ma także `lastInteractionAt`,
świeżość bezczynności wraca do czasu rozpoczęcia tej sesji, a nie do późniejszych
zapisów porządkowych.

## Utrzymanie sesji

OpenClaw automatycznie ogranicza rozmiar magazynu sesji w czasie. Domyślnie działa
w trybie `enforce` i wykonuje czyszczenie podczas utrzymania. Ustaw
`session.maintenance.mode` na `"warn"`, aby zgłaszać, co zostałoby wyczyszczone, bez modyfikowania magazynu/plików:

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

Dla produkcyjnych limitów `maxEntries` zapisy runtime Gateway używają małego bufora wysokiego progu i czyszczą partiami z powrotem do skonfigurowanego limitu. Odczyty magazynu sesji nie przycinają ani nie ograniczają wpisów podczas uruchamiania Gateway. Pozwala to uniknąć pełnego czyszczenia magazynu przy każdym uruchomieniu lub izolowanej sesji Cron. `openclaw sessions cleanup --enforce` stosuje limit natychmiast.

Sesje próbne uruchomień modelu Gateway są domyślnie krótkotrwałe. Pasujące wiersze z
ściśle jawnymi kluczami, takimi jak `agent:*:explicit:model-run-<uuid>`, używają stałej retencji `24h`,
ale czyszczenie jest sterowane presją: usuwa nieaktualne wiersze próbne tylko wtedy, gdy
osiągnięta zostanie presja utrzymania/limitu wpisów sesji. Gdy czyszczenie uruchomień modelu działa,
wykonuje się przed szerszym progiem wieku nieaktualnych wpisów i limitem wpisów. Zwykłe sesje bezpośrednie,
grupowe, wątków, Cron, hooków, Heartbeat, ACP i sub-agentów nie dziedziczą
tej 24-godzinnej retencji.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki konwersacji, w tym sesje grupowe
i sesje czatu ograniczone do wątku, jednocześnie nadal pozwalając syntetycznym wpisom Cron,
hooków, Heartbeat, ACP i sub-agentów starzeć się i wygasać.

Jeśli wcześniej używano izolacji wiadomości bezpośrednich, a później przywrócono
`session.dmScope` do `main`, podejrzyj nieaktualne wiersze DM kluczowane peerem za pomocą
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Zastosowanie tej samej flagi
wycofuje te stare wiersze bezpośrednich DM i zachowuje ich transkrypty jako usunięte
archiwa.

Podejrzyj za pomocą `openclaw sessions cleanup --dry-run`.

## Inspekcja sesji

- `openclaw status` -- ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` -- wszystkie sesje (filtruj za pomocą `--active <minutes>`).
- `/status` na czacie -- użycie kontekstu, model i przełączniki.
- `/context list` -- co znajduje się w prompcie systemowym.

## Więcej informacji

- [Przycinanie sesji](/pl/concepts/session-pruning) -- skracanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) -- podsumowywanie długich konwersacji
- [Narzędzia sesji](/pl/concepts/session-tool) -- narzędzia agenta do pracy między sesjami
- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction) --
  schemat magazynu, transkrypty, polityka wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Wielu agentów](/pl/concepts/multi-agent) — kierowanie i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak odłączona praca tworzy rekordy zadań z odwołaniami do sesji
- [Kierowanie kanałów](/pl/channels/channel-routing) — jak przychodzące wiadomości są kierowane do sesji

## Powiązane

- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
