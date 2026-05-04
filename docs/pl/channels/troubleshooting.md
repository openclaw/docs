---
read_when:
    - Transport kanału informuje, że jest połączony, ale odpowiedzi kończą się niepowodzeniem
    - Przed dogłębną dokumentacją dostawcy potrzebne są kontrole specyficzne dla kanału.
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i rozwiązaniami dla poszczególnych kanałów
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-05-04T02:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy kanał się łączy, ale zachowanie jest nieprawidłowe.

## Sekwencja poleceń

Uruchom je najpierw w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prawidłowy stan bazowy:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Sonda kanału pokazuje, że transport jest połączony oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                         | Najszybsze sprawdzenie                                       | Naprawa                                                                                                                              |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Połączony, ale brak odpowiedzi w wiadomościach bezpośrednich     | `openclaw pairing list whatsapp`                    | Zatwierdź nadawcę albo zmień politykę wiadomości bezpośrednich/listę dozwolonych.                                                                                    |
| Wiadomości grupowe ignorowane          | Sprawdź `requireMention` i wzorce wzmianek w konfiguracji | Wspomnij bota albo złagodź politykę wzmianek dla tej grupy.                                                                          |
| Logowanie kodem QR kończy się limitem czasu z 408     | Sprawdź zmienne środowiskowe Gateway `HTTPS_PROXY` / `HTTP_PROXY`      | Ustaw osiągalny serwer proxy; używaj `NO_PROXY` tylko dla obejść.                                                                         |
| Losowe pętle rozłączeń/ponownych logowań | `openclaw channels status --probe` + logi           | Ostatnie ponowne połączenia są oznaczane nawet przy bieżącym połączeniu; obserwuj logi, uruchom ponownie Gateway, a następnie połącz ponownie, jeśli wahania nadal występują. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                              | Najszybsze sprawdzenie                                    | Naprawa                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi    | `openclaw pairing list telegram`                 | Zatwierdź parowanie albo zmień politykę wiadomości bezpośrednich.                                                                                       |
| Bot online, ale grupa pozostaje cicha    | Sprawdź wymaganie wzmianki i tryb prywatności bota  | Wyłącz tryb prywatności dla widoczności w grupie albo wspomnij bota.                                                                  |
| Błędy wysyłania z błędami sieci    | Sprawdź logi pod kątem błędów wywołań API Telegram      | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                          |
| Start zgłasza `getMe returned 401` | Sprawdź skonfigurowane źródło tokenu                    | Skopiuj ponownie albo wygeneruj ponownie token BotFather i zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` konta domyślnego.     |
| Odpytywanie zacina się albo ponownie łączy powoli  | `openclaw logs --follow` dla diagnostyki odpytywania | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Utrzymujące się zacięcia nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie  | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`         | Zmniejsz liczbę poleceń Telegram z Plugin/Skills/niestandardowych albo wyłącz natywne menu.                                                      |
| Po aktualizacji lista dozwolonych blokuje cię    | `openclaw security audit` i listy dozwolonych w konfiguracji  | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi identyfikatorami nadawców.                                                |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                                   | Najszybsze sprawdzenie                                                          | Naprawa                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, ale brak odpowiedzi w gildii           | `openclaw channels status --probe`                                     | Zezwól na gildię/kanał i sprawdź intencję treści wiadomości.                                                                                                                  |
| Wiadomości grupowe ignorowane                    | Sprawdź logi pod kątem odrzuceń przez bramkowanie wzmiankami                                    | Wspomnij bota albo ustaw `requireMention: false` dla gildii/kanału.                                                                                                               |
| Użycie pisania/tokenów, ale brak wiadomości Discord | Log sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false` | Model odpowiedział prywatnie zamiast wywołać narzędzie wiadomości. Użyj modelu niezawodnego w wywołaniach narzędzi albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby publikować automatycznie. |
| Brakuje odpowiedzi w wiadomościach bezpośrednich                        | `openclaw pairing list discord`                                        | Zatwierdź parowanie wiadomości bezpośrednich albo dostosuj politykę wiadomości bezpośrednich.                                                                                                                                 |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                | Najszybsze sprawdzenie                             | Naprawa                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tryb gniazda połączony, ale brak odpowiedzi | `openclaw channels status --probe`        | Sprawdź token aplikacji + token bota i wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| Wiadomości bezpośrednie zablokowane                            | `openclaw pairing list slack`             | Zatwierdź parowanie albo złagodź politykę wiadomości bezpośrednich.                                                                                                                  |
| Wiadomość kanału zignorowana                | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo przełącz politykę na `open`.                                                                                                        |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów ze Slack](/pl/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                          | Najszybsze sprawdzenie                                                           | Naprawa                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Brak zdarzeń przychodzących                | Sprawdź osiągalność Webhook/serwera i uprawnienia aplikacji                  | Napraw adres URL Webhook albo stan serwera BlueBubbles.          |
| Można wysyłać, ale nie odbierać w macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages                 | Nadaj ponownie uprawnienia TCC i uruchom ponownie proces kanału. |
| Nadawca wiadomości bezpośrednich zablokowany                | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie albo zaktualizuj listę dozwolonych.                  |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)
- [Rozwiązywanie problemów z BlueBubbles](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                         | Najszybsze sprawdzenie                              | Naprawa                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Demon osiągalny, ale bot milczy | `openclaw channels status --probe`         | Sprawdź adres URL/konto demona `signal-cli` i tryb odbierania. |
| Wiadomość bezpośrednia zablokowana                      | `openclaw pairing list signal`             | Zatwierdź nadawcę albo dostosuj politykę wiadomości bezpośrednich.                      |
| Odpowiedzi grupowe nie są wyzwalane    | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo poluzuj bramkowanie.                       |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                         | Najszybsze sprawdzenie                               | Naprawa                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”      | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw dane uwierzytelniające albo uruchom ponownie Gateway.                         |
| Brak wiadomości przychodzących             | `openclaw channels status --probe`          | Sprawdź dane uwierzytelniające na QQ Open Platform.                     |
| Głos nie jest transkrybowany           | Sprawdź konfigurację dostawcy STT                   | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.          |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania interakcji platformy QQ  | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                             | Najszybsze sprawdzenie                          | Naprawa                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Zalogowany, ale ignoruje wiadomości w pokoju | `openclaw channels status --probe`     | Sprawdź `groupPolicy`, listę dozwolonych pokoi i bramkowanie wzmiankami.                  |
| Wiadomości bezpośrednie nie są przetwarzane                  | `openclaw pairing list matrix`         | Zatwierdź nadawcę albo dostosuj politykę wiadomości bezpośrednich.                                       |
| Pokoje szyfrowane zawodzą                | `openclaw matrix verify status`        | Zweryfikuj ponownie urządzenie, a następnie sprawdź `openclaw matrix verify backup status`.  |
| Przywracanie kopii zapasowej oczekuje/nie działa    | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo uruchom ponownie z kluczem odzyskiwania. |
| Podpisywanie krzyżowe/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`     | Napraw magazyn sekretów, podpisywanie krzyżowe i stan kopii zapasowej w jednym przebiegu.       |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
