---
read_when:
    - Chcesz, aby odpowiedzi w jednej aktywnej sesji zostały przeniesione z Telegramu do Discorda, Slacka, Mattermost lub innego połączonego kanału
    - Konfigurujesz `session.identityLinks` dla wiadomości bezpośrednich między kanałami
    - Polecenie /dock informuje, że nadawca nie jest połączony lub nie istnieje aktywna sesja
summary: Przenieś trasę odpowiedzi jednej sesji OpenClaw między połączonymi kanałami czatu
title: Dokowanie kanału
x-i18n:
    generated_at: "2026-07-12T15:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Dokowanie kanału to przekierowanie odpowiedzi dla jednej sesji OpenClaw. Zachowuje ten sam
kontekst konwersacji, ale zmienia miejsce dostarczania przyszłych odpowiedzi w tej sesji.
Dokowanie działa tylko z czatu bezpośredniego; nie można go uruchomić z czatu
grupowego.

## Przykład

Alice może wysyłać wiadomości do OpenClaw w Telegramie i Discordzie:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Jeśli Alice wyśle następujące polecenie z czatu bezpośredniego w Telegramie:

```text
/dock_discord
```

OpenClaw zachowa kontekst bieżącej sesji i zmieni trasę odpowiedzi:

| Przed dokowaniem                  | Po `/dock_discord`              |
| --------------------------------- | ------------------------------- |
| Odpowiedzi trafiają do Telegrama `123` | Odpowiedzi trafiają do Discorda `456` |

Sesja nie jest tworzona ponownie. Historia transkrypcji pozostaje powiązana z tą
samą sesją.

## Dlaczego warto go używać

Dokowania należy używać, gdy zadanie rozpoczyna się w jednej aplikacji czatu, ale kolejne odpowiedzi
powinny trafiać do innej.

Typowy przebieg:

1. Rozpocznij zadanie agenta w Telegramie.
2. Przejdź do Discorda, gdzie koordynujesz pracę.
3. Wyślij `/dock_discord` z czatu bezpośredniego w Telegramie.
4. Zachowaj tę samą sesję OpenClaw, ale odbieraj przyszłe odpowiedzi w Discordzie.

## Wymagana konfiguracja

Dokowanie wymaga `session.identityLinks`. Nadawca źródłowy i docelowy uczestnik
muszą należeć do tej samej grupy tożsamości:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Wartości są identyfikatorami uczestników poprzedzonymi nazwą kanału:

| Wartość        | Znaczenie                              |
| -------------- | -------------------------------------- |
| `telegram:123` | Identyfikator nadawcy Telegram `123`   |
| `discord:456`  | Identyfikator bezpośredniego uczestnika Discord `456` |
| `slack:U123`   | Identyfikator użytkownika Slack `U123` |

Klucz kanoniczny (`alice` powyżej) jest jedynie nazwą wspólnej grupy tożsamości. Polecenia
dokowania używają wartości poprzedzonych nazwą kanału, aby potwierdzić, że nadawca źródłowy i
docelowy uczestnik są tą samą osobą.

## Polecenia

OpenClaw generuje jedno polecenie `/dock-<channel>` dla każdego załadowanego pluginu kanału,
który obsługuje polecenia natywne, więc lista rośnie wraz z dodawaniem pluginów. Dołączone
pluginy, które obecnie je obsługują:

| Kanał docelowy | Polecenie          | Alias              |
| -------------- | ------------------ | ------------------ |
| Discord        | `/dock-discord`    | `/dock_discord`    |
| Mattermost     | `/dock-mattermost` | `/dock_mattermost` |
| Slack          | `/dock-slack`      | `/dock_slack`      |
| Telegram       | `/dock-telegram`   | `/dock_telegram`   |

Forma z podkreśleniem jest również nazwą natywnego polecenia w interfejsach takich jak Telegram,
które bezpośrednio udostępniają polecenia z ukośnikiem.

## Co się zmienia

Dokowanie aktualizuje pola dostarczania aktywnej sesji:

| Pole sesji      | Przykład po `/dock_discord`             |
| --------------- | --------------------------------------- |
| `lastChannel`   | `discord`                               |
| `lastTo`        | `456`                                   |
| `lastAccountId` | konto kanału docelowego lub `default`   |

Pola te są zapisywane w magazynie sesji i używane do dostarczania późniejszych odpowiedzi
w tej sesji.

## Co się nie zmienia

Dokowanie nie:

- tworzy kont kanałów
- łączy nowego bota Discorda, Telegrama, Slacka ani Mattermosta
- przyznaje użytkownikowi dostępu
- omija list dozwolonych kanałów ani zasad wiadomości bezpośrednich
- przenosi historii transkrypcji do innej sesji
- powoduje współdzielenia sesji przez niepowiązanych użytkowników

Zmienia wyłącznie trasę dostarczania dla bieżącej sesji.

## Rozwiązywanie problemów

**Polecenie informuje, że nadawca nie jest powiązany.**

Dodaj zarówno bieżącego nadawcę, jak i docelowego uczestnika do tej samej grupy
`session.identityLinks`. Jeśli na przykład nadawca Telegram `123` ma zadokować
do uczestnika Discord `456`, uwzględnij zarówno `telegram:123`, jak i `discord:456`.

**Polecenie informuje, że dokowanie jest dostępne tylko z czatów bezpośrednich.**

Wyślij polecenie dokowania z czatu bezpośredniego z OpenClaw, a nie z czatu grupowego.

**Polecenie informuje, że nie istnieje aktywna sesja.**

Dokuj z istniejącej sesji czatu bezpośredniego. Polecenie wymaga wpisu aktywnej sesji,
aby móc zapisać nową trasę.

**Odpowiedzi nadal trafiają do starego kanału.**

Sprawdź, czy polecenie zwróciło komunikat o powodzeniu, i potwierdź, że identyfikator
docelowego uczestnika odpowiada identyfikatorowi używanemu przez ten kanał. Dokowanie zmienia tylko trasę
aktywnej sesji; inna sesja może nadal kierować odpowiedzi w inne miejsce.

**Muszę przełączyć się z powrotem.**

Wyślij odpowiednie polecenie dla pierwotnego kanału, na przykład `/dock_telegram` lub
`/dock-telegram`, od powiązanego nadawcy.
