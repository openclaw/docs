---
read_when:
    - Transport kanału zgłasza połączenie, ale odpowiedzi nie działają
    - Przed zapoznaniem się ze szczegółową dokumentacją dostawcy należy przeprowadzić testy specyficzne dla kanału
summary: Szybkie rozwiązywanie problemów na poziomie kanałów z charakterystycznymi dla każdego kanału objawami awarii i sposobami ich usuwania
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-07-12T14:50:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy kanał się łączy, ale działa nieprawidłowo.

## Sekwencja poleceń

Najpierw uruchom kolejno:

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
- Test kanału wskazuje, że transport jest połączony, a tam, gdzie jest to obsługiwane, wyświetla `works` lub `audit ok`

## Po aktualizacji

Użyj tej procedury, gdy po aktualizacji zniknie Telegram, iMessage, konfiguracja z czasów BlueBubbles lub inny kanał pluginu.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Poszukaj komunikatu `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` w wyniku `openclaw status --all`. Oznacza to, że kanał jest skonfigurowany, ale podczas konfiguracji lub ładowania pluginu napotkano uszkodzone drzewo zależności, przez co kanał nie został zarejestrowany. Polecenie `openclaw doctor --fix` usuwa nieaktualne dowiązania symboliczne zależności środowiska uruchomieniowego pluginu oraz nieaktualne kopie danych uwierzytelniających, a następnie `openclaw gateway restart` ponownie wczytuje prawidłowy stan.

## WhatsApp

### Symptomy awarii WhatsApp

| Objaw                                 | Najszybsza kontrola                                  | Rozwiązanie                                                                                                                                                            |
| ------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Połączenie działa, ale brak odpowiedzi w wiadomościach prywatnych | `openclaw pairing list whatsapp`                     | Zatwierdź nadawcę albo zmień zasady wiadomości prywatnych lub listę dozwolonych.                                                                                        |
| Wiadomości grupowe są ignorowane      | Sprawdź `requireMention` i wzorce wzmianek w konfiguracji | Wspomnij bota albo złagodź zasady wymagania wzmianki dla tej grupy.                                                                                                     |
| Logowanie kodem QR kończy się błędem 408 | Sprawdź zmienne środowiskowe Gateway `HTTPS_PROXY` / `HTTP_PROXY` | Ustaw osiągalny serwer proxy; używaj `NO_PROXY` tylko do omijania serwera proxy.                                                                                         |
| Losowe rozłączenia lub pętle ponownego logowania | `openclaw channels status --probe` i logi            | Ostatnie ponowne połączenia są oznaczane nawet przy aktywnym połączeniu; obserwuj logi, uruchom ponownie Gateway, a jeśli niestabilność się utrzymuje, połącz konto ponownie. |
| Pętla `status=408 Request Time-out`   | Test, logi, doctor, a następnie stan Gateway          | Najpierw napraw łączność lub problemy z czasem odpowiedzi hosta; jeśli pętla się utrzymuje, wykonaj kopię zapasową danych uwierzytelniających i ponownie połącz konto.      |
| Odpowiedzi docierają z opóźnieniem sekund lub minut | `openclaw doctor --fix`                              | Doctor zatrzymuje zweryfikowane, nieaktualne lokalne klienty TUI, jeśli pogarszają działanie pętli zdarzeń Gateway.                                                       |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Symptomy awarii Telegram

| Objaw                                  | Najszybsza kontrola                                  | Rozwiązanie                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przebiegu odpowiedzi | `openclaw pairing list telegram`                     | Zatwierdź parowanie albo zmień zasady wiadomości prywatnych.                                                                                                               |
| Bot jest online, ale grupa pozostaje bez odpowiedzi | Sprawdź wymaganie wzmianki i tryb prywatności bota   | Wyłącz tryb prywatności, aby bot widział wiadomości grupowe, albo wspomnij bota.                                                                                            |
| Błędy wysyłania spowodowane problemami z siecią | Sprawdź w logach błędy wywołań API Telegram          | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                                                                       |
| Podczas uruchamiania pojawia się `getMe returned 401` | Sprawdź skonfigurowane źródło tokenu                 | Ponownie skopiuj lub wygeneruj token BotFather i zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` domyślnego konta.                                           |
| Odpytywanie zatrzymuje się lub powoli wznawia połączenie | `openclaw logs --follow` w celu diagnostyki odpytywania | Wykonaj aktualizację; jeśli ponowne uruchomienia są fałszywymi alarmami, dostosuj `pollingStallThresholdMs`. Trwałe zatrzymania nadal wskazują na problemy z proxy/DNS/IPv6. |
| `setMyCommands` odrzucone podczas uruchamiania | Sprawdź w logach `BOT_COMMANDS_TOO_MUCH`             | Zmniejsz liczbę poleceń Telegram pochodzących z pluginów, Skills lub konfiguracji niestandardowej albo wyłącz menu natywne.                                                |
| Po aktualizacji lista dozwolonych blokuje użytkownika | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` albo zastąp `@username` liczbowymi identyfikatorami nadawców.                                                                               |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Symptomy awarii Discord

| Objaw                                        | Najszybsza kontrola                                                                                                                       | Rozwiązanie                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot jest online, ale nie odpowiada na serwerze | `openclaw channels status --probe`                                                                                                        | Zezwól na serwer lub kanał i sprawdź uprawnienie dostępu do treści wiadomości.                                                                                                                                                                                                                                                                                  |
| Wiadomości grupowe są ignorowane             | Sprawdź w logach odrzucenia spowodowane brakiem wzmianki                                                                                  | Wspomnij bota albo ustaw `requireMention: false` dla serwera lub kanału.                                                                                                                                                                                                                                                                                        |
| Widać pisanie lub użycie tokenów, ale brak wiadomości Discord | Sprawdź, czy jest to zdarzenie pokoju otoczenia, czy pokój z włączonym `message_tool`, w którym model pominął `message(action=send)` | Sprawdź szczegółowy log Gateway pod kątem metadanych pominiętej końcowej treści, zweryfikuj `messages.groupChat.unmentionedInbound`, przeczytaj [Zdarzenia pokoju otoczenia](/pl/channels/ambient-room-events) albo pozostaw `messages.groupChat.visibleReplies: "automatic"` dla zwykłych żądań grupowych. |
| Brak odpowiedzi w wiadomościach prywatnych   | `openclaw pairing list discord`                                                                                                           | Zatwierdź parowanie wiadomości prywatnych albo dostosuj ich zasady.                                                                                                                                                                                                                                                                                             |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Symptomy awarii Slack

| Objaw                                         | Najszybsza kontrola                             | Rozwiązanie                                                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tryb gniazda jest połączony, ale brak odpowiedzi | `openclaw channels status --probe`              | Sprawdź token aplikacji, token bota i wymagane zakresy; w konfiguracjach opartych na SecretRef zwróć uwagę na `botTokenStatus` / `appTokenStatus = configured_unavailable`.                         |
| Wiadomości prywatne są blokowane              | `openclaw pairing list slack`                   | Zatwierdź parowanie albo złagodź zasady wiadomości prywatnych.                                                                                                                                    |
| Wiadomość na kanale jest ignorowana           | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo zmień zasady na `open`.                                                                                                                                                      |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów ze Slack](/pl/channels/slack#troubleshooting)

## iMessage

### Symptomy awarii iMessage

| Objaw                                      | Najszybsza kontrola                                        | Rozwiązanie                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Brak `imsg` lub błąd poza systemem macOS   | `openclaw channels status --probe --channel imessage`      | Uruchom OpenClaw na komputerze Mac z aplikacją Messages albo użyj nakładki SSH dla `cliPath`. |
| Wysyłanie działa, ale odbieranie w macOS nie | Sprawdź uprawnienia prywatności macOS do automatyzacji Messages | Ponownie przyznaj uprawnienia TCC i uruchom ponownie proces kanału.                           |
| Nadawca wiadomości prywatnej jest blokowany | `openclaw pairing list imessage`                           | Zatwierdź parowanie albo zaktualizuj listę dozwolonych.                                      |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)

## Signal

### Symptomy awarii Signal

| Objaw                                     | Najszybsza kontrola                                  | Rozwiązanie                                                                 |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Demon jest osiągalny, ale bot nie odpowiada | `openclaw channels status --probe`                   | Sprawdź adres URL demona `signal-cli`, konto i tryb odbierania.             |
| Wiadomość prywatna jest blokowana         | `openclaw pairing list signal`                       | Zatwierdź nadawcę albo dostosuj zasady wiadomości prywatnych.               |
| Odpowiedzi grupowe nie są wyzwalane       | Sprawdź listę dozwolonych grup i wzorce wzmianek     | Dodaj nadawcę lub grupę albo złagodź warunki dopuszczania.                   |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Symptomy awarii QQ Bot

| Objaw                                      | Najszybsza kontrola                                  | Rozwiązanie                                                                          |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Bot odpowiada „odleciał na Marsa”          | Sprawdź `appId` i `clientSecret` w konfiguracji      | Ustaw dane uwierzytelniające albo uruchom ponownie Gateway.                           |
| Brak wiadomości przychodzących             | `openclaw channels status --probe`                   | Sprawdź dane uwierzytelniające na platformie QQ Open Platform.                       |
| Wiadomości głosowe nie są transkrybowane   | Sprawdź konfigurację dostawcy STT                    | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.                            |
| Wiadomości proaktywne nie docierają        | Sprawdź wymagania platformy QQ dotyczące interakcji  | QQ może blokować wiadomości inicjowane przez bota, jeśli ostatnio nie było interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury błędów Matrix

| Objaw                                         | Najszybsza kontrola                     | Rozwiązanie                                                                                         |
| --------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Zalogowano, ale wiadomości z pokoju są ignorowane | `openclaw channels status --probe`     | Sprawdź `groupPolicy`, listę dozwolonych pokojów oraz wymóg wzmianki.                               |
| Wiadomości prywatne nie są przetwarzane       | `openclaw pairing list matrix`          | Zatwierdź nadawcę lub dostosuj zasady wiadomości prywatnych.                                        |
| Szyfrowane pokoje nie działają                | `openclaw matrix verify status`         | Ponownie zweryfikuj urządzenie, a następnie sprawdź `openclaw matrix verify backup status`.          |
| Przywracanie kopii zapasowej oczekuje lub nie działa | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` lub ponów operację z kluczem odzyskiwania.           |
| Podpisywanie krzyżowe/inicjalizacja wygląda nieprawidłowo | `openclaw matrix verify bootstrap` | Napraw za jednym razem magazyn sekretów, podpisywanie krzyżowe i stan kopii zapasowej.               |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
