---
read_when:
    - Transport kanału wskazuje połączenie, ale odpowiedzi kończą się niepowodzeniem
    - Potrzebujesz kontroli specyficznych dla kanału przed szczegółową dokumentacją dostawcy
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami błędów i poprawkami dla poszczególnych kanałów
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-06-27T17:14:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy kanał się łączy, ale zachowanie jest nieprawidłowe.

## Drabina poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Zdrowy stan bazowy:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Sonda kanału pokazuje, że transport jest połączony oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## Po aktualizacji

Użyj tego, gdy Telegram, iMessage, konfiguracje z ery BlueBubbles albo inny kanał
Plugin znika po aktualizacji.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Szukaj `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` w `openclaw status --all`. Oznacza to, że kanał jest skonfigurowany, ale
ścieżka konfiguracji/ładowania Plugin natrafiła na uszkodzone drzewo zależności zamiast zarejestrować
kanał. `openclaw doctor --fix` usuwa nieaktualne katalogi staging zależności Plugin
i nieaktualne cienie uwierzytelniania, a następnie `openclaw gateway restart` ponownie ładuje
czysty stan.

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                               | Najszybsze sprawdzenie                              | Naprawa                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Połączono, ale brak odpowiedzi DM   | `openclaw pairing list whatsapp`                    | Zatwierdź nadawcę albo zmień zasady/listę dozwolonych DM.                                                                                         |
| Wiadomości grupowe ignorowane       | Sprawdź `requireMention` + wzorce wzmianek w konfiguracji | Wspomnij bota albo złagodź zasady wzmianek dla tej grupy.                                                                                         |
| Logowanie QR kończy się 408         | Sprawdź zmienne środowiskowe Gateway `HTTPS_PROXY` / `HTTP_PROXY` | Ustaw osiągalne proxy; używaj `NO_PROXY` tylko do obejść.                                                                                         |
| Losowe pętle rozłączeń/ponownych logowań | `openclaw channels status --probe` + logi       | Ostatnie ponowne połączenia są oznaczane nawet przy aktualnym połączeniu; obserwuj logi, zrestartuj Gateway, a potem ponownie połącz, jeśli niestabilność trwa. |
| Pętla `status=408 Request Time-out` | Sonda, logi, doctor, potem status Gateway            | Najpierw napraw łączność/czasowanie hosta; wykonaj kopię zapasową uwierzytelniania i ponownie połącz konto, jeśli pętla się utrzymuje.             |
| Odpowiedzi przychodzą po sekundach/minutach | `openclaw doctor --fix`                       | Doctor zatrzymuje zweryfikowane nieaktualne lokalne klienty TUI, gdy degradują pętlę zdarzeń Gateway.                                             |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                               | Najszybsze sprawdzenie                              | Naprawa                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`   | Zatwierdź parowanie albo zmień zasady DM.                                                                                               |
| Bot online, ale grupa pozostaje cicha | Zweryfikuj wymóg wzmianki i tryb prywatności bota | Wyłącz tryb prywatności dla widoczności grupy albo wspomnij bota.                                                                       |
| Błędy wysyłania z błędami sieci      | Przejrzyj logi pod kątem nieudanych wywołań API Telegram | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                                    |
| Przy starcie zgłoszono `getMe returned 401` | Sprawdź skonfigurowane źródło tokenu          | Skopiuj ponownie albo wygeneruj od nowa token BotFather i zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` konta domyślnego. |
| Polling zacina się albo powoli łączy ponownie | `openclaw logs --follow` dla diagnostyki pollingu | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Utrzymujące się zacięcia nadal wskazują proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie | Przejrzyj logi pod kątem `BOT_COMMANDS_TOO_MUCH` | Zmniejsz liczbę poleceń Telegram z Plugin/skill/niestandardowych albo wyłącz natywne menu.                                                |
| Po aktualizacji lista dozwolonych blokuje Ciebie | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi ID nadawców.                                                         |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                                      | Najszybsze sprawdzenie                                                                                                              | Naprawa                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, ale brak odpowiedzi w gildii   | `openclaw channels status --probe`                                                                                                  | Zezwól na gildię/kanał i zweryfikuj intencję zawartości wiadomości.                                                                                                                                                                                                                 |
| Wiadomości grupowe ignorowane              | Sprawdź logi pod kątem odrzuceń przez bramkowanie wzmianek                                                                          | Wspomnij bota albo ustaw dla gildii/kanału `requireMention: false`.                                                                                                                                                                                                                 |
| Użycie pisania/tokenu, ale brak wiadomości Discord | Sprawdź, czy to zdarzenie pokoju ambientowego, czy pokój `message_tool` z opt-in, w którym model pominął `message(action=send)` | Przejrzyj szczegółowy log Gateway pod kątem metadanych stłumionego finalnego payloadu, zweryfikuj `messages.groupChat.unmentionedInbound`, przeczytaj [Zdarzenia pokoju ambientowego](/pl/channels/ambient-room-events) albo pozostaw `messages.groupChat.visibleReplies: "automatic"` dla zwykłych żądań grupowych. |
| Brak odpowiedzi DM                         | `openclaw pairing list discord`                                                                                                     | Zatwierdź parowanie DM albo dostosuj zasady DM.                                                                                                                                                                                                                                     |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                      | Najszybsze sprawdzenie                       | Naprawa                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tryb socket połączony, ale brak odpowiedzi | `openclaw channels status --probe`           | Zweryfikuj token aplikacji + token bota i wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM zablokowane                             | `openclaw pairing list slack`                | Zatwierdź parowanie albo złagodź zasady DM.                                                                                                                       |
| Wiadomość kanału zignorowana               | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo przełącz zasadę na `open`.                                                                                                                   |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów ze Slack](/pl/channels/slack#troubleshooting)

## iMessage

### Sygnatury awarii iMessage

| Objaw                                  | Najszybsze sprawdzenie                                  | Naprawa                                                                 |
| -------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Brak `imsg` albo nie działa poza macOS | `openclaw channels status --probe --channel imessage`   | Uruchom OpenClaw na Macu z Messages albo użyj wrappera SSH dla `cliPath`. |
| Można wysyłać, ale nie odbierać na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages | Przyznaj ponownie uprawnienia TCC i zrestartuj proces kanału.           |
| Nadawca DM zablokowany                 | `openclaw pairing list imessage`                        | Zatwierdź parowanie albo zaktualizuj listę dozwolonych.                 |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                            | Najszybsze sprawdzenie                       | Naprawa                                                    |
| -------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Demon osiągalny, ale bot milczy  | `openclaw channels status --probe`           | Zweryfikuj URL/konto demona `signal-cli` i tryb odbioru.   |
| DM zablokowane                   | `openclaw pairing list signal`               | Zatwierdź nadawcę albo dostosuj zasady DM.                 |
| Odpowiedzi grupowe się nie uruchamiają | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo poluzuj bramkowanie.              |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                                   | Najszybsze sprawdzenie                         | Naprawa                                                                   |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”            | Zweryfikuj `appId` i `clientSecret` w konfiguracji | Ustaw poświadczenia albo zrestartuj Gateway.                              |
| Brak wiadomości przychodzących          | `openclaw channels status --probe`             | Zweryfikuj poświadczenia na QQ Open Platform.                             |
| Głos nie jest transkrybowany            | Sprawdź konfigurację dostawcy STT              | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.                |
| Wiadomości proaktywne nie docierają     | Sprawdź wymagania interakcji platformy QQ      | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                               | Najszybsza kontrola                    | Rozwiązanie                                                               |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości w pokojach | `openclaw channels status --probe`     | Sprawdź `groupPolicy`, listę dozwolonych pokojów i bramkowanie wzmianek. |
| DM nie są przetwarzane              | `openclaw pairing list matrix`         | Zatwierdź nadawcę albo dostosuj zasady DM.                                |
| Zaszyfrowane pokoje nie działają    | `openclaw matrix verify status`        | Zweryfikuj urządzenie ponownie, a następnie sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje lub jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo uruchom ponownie z kluczem odzyskiwania. |
| Podpisywanie krzyżowe/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`     | Napraw magazyn sekretów, podpisywanie krzyżowe i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
