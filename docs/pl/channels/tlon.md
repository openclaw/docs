---
read_when:
    - Praca nad funkcjami kanału Tlon/Urbit
summary: Stan obsługi Tlon/Urbit, możliwości i konfiguracja
title: Tlon
x-i18n:
    generated_at: "2026-07-12T14:54:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon to zdecentralizowany komunikator zbudowany na platformie Urbit. OpenClaw łączy się z Twoim statkiem Urbit i
odpowiada na wiadomości prywatne oraz wiadomości na czatach grupowych. Odpowiedzi grupowe domyślnie wymagają wzmianki @, a dodatkowo
obowiązują reguły autoryzacji i przepływ zatwierdzania przez właściciela.

Stan: dołączony plugin. Obsługiwane są wiadomości prywatne, wzmianki grupowe, wątki, tekst sformatowany, przesyłanie i pobieranie obrazów oraz
system zatwierdzania przez właściciela. Reakcje i ankiety nie są obsługiwane.

## Dołączony plugin

Tlon jest dołączony do bieżących wydań OpenClaw; kompilacje pakietowe nie wymagają osobnej instalacji.

W starszej kompilacji lub instalacji niestandardowej, która go wyklucza, zainstaluj go z npm:

```bash
openclaw plugins install @openclaw/tlon
```

Użyj samej nazwy pakietu, aby śledzić tag bieżącego wydania. Przypnij wersję (`@openclaw/tlon@x.y.z`)
tylko w celu uzyskania powtarzalnych instalacji.

Z lokalnego repozytorium roboczego:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Konfiguracja

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Możesz też edytować konfigurację bezpośrednio:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // zalecane: Twój statek, zawsze autoryzowany
    },
  },
}
```

Po bezpośredniej edycji konfiguracji uruchom ponownie Gateway. Następnie wyślij botowi wiadomość prywatną lub oznacz go wzmianką @
na kanale grupowym.

## Statki prywatne/LAN

OpenClaw domyślnie blokuje prywatne/wewnętrzne nazwy hostów i zakresy adresów IP w celu ochrony przed SSRF. Jeśli Twój
statek działa w sieci prywatnej (localhost, adres IP w LAN, wewnętrzna nazwa hosta), jawnie włącz tę możliwość:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Dotyczy to adresów docelowych takich jak `http://localhost:8080`, `http://192.168.x.x:8080` oraz
`http://my-ship.local:8080`. Włączaj tę opcję wyłącznie dla zaufanego adresu URL statku; wyłącza ona ochronę przed SSRF
dla żądań HTTP tego konta.

<Note>
`channels.tlon.allowPrivateNetwork` (klucz płaski) został wycofany. Polecenie `openclaw doctor --fix` automatycznie przenosi go do
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Kanały grupowe

Przypnij kanały ręcznie lub włącz automatyczne wykrywanie:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

Gdy `autoDiscoverChannels` nie jest ustawione w konfiguracji, jego wartością domyślną jest `false`; kreator konfiguracji domyślnie sugeruje
odpowiedź „tak” i jawnie zapisuje `true`. Po włączeniu tej opcji OpenClaw odpytuje dołączone grupy podczas uruchamiania,
obserwuje nowe kanały w miarę akceptowania zaproszeń do grup i sprawdza je ponownie co 2 minuty.

## Kontrola dostępu

Lista dozwolonych nadawców wiadomości prywatnych (pusta = wiadomości prywatne są niedozwolone, chyba że nadawcą jest `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autoryzacja grupowa ma domyślnie tryb `restricted` dla każdego kanału. Ustaw `defaultAuthorizedShips` jako
wartość bazową i zastępuj ją dla poszczególnych gniazd kanałów:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Gdy bot odpowie już w wątku, nadal odpowiada na późniejsze wiadomości w tym wątku
bez potrzeby ponownego oznaczania go wzmianką.

## Właściciel i system zatwierdzania

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Statek właściciela jest autoryzowany wszędzie: zaproszenia do wiadomości prywatnych są zawsze automatycznie akceptowane, zaproszenia do grup są
zawsze automatycznie akceptowane, a wiadomości na kanałach zawsze przechodzą autoryzację. Właściciel nie musi
znajdować się w `dmAllowlist`, `defaultAuthorizedShips` ani `groupInviteAllowlist`.

Gdy ustawiono `ownerShip`, nieautoryzowane żądania nie są po prostu odrzucane — trafiają do kolejki oczekujących
zatwierdzeń, a właściciel otrzymuje wiadomość prywatną:

- Żądania wiadomości prywatnych od statków spoza `dmAllowlist`
- Wzmianki na kanałach, na których nadawca nie przechodzi autoryzacji
- Zaproszenia do grup od statków spoza `groupInviteAllowlist` (gdy automatyczne akceptowanie jest wyłączone albo włączone, lecz
  zapraszający nie znajduje się na liście dozwolonych)

Właściciel odpowiada w wiadomości prywatnej, aby obsłużyć żądanie:

| Odpowiedź właściciela         | Skutek                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| `approve` / `deny` / `block` | Wykonuje działanie na najnowszym oczekującym zatwierdzeniu        |
| `approve <id>` / `deny <id>` | Wykonuje działanie na określonym zatwierdzeniu według identyfikatora |
| `block`                      | Blokuje również statek natywnie, aby nie mógł połączyć się ponownie |
| `unblock ~ship`              | Cofa natywną blokadę                                              |
| `blocked`                    | Wyświetla obecnie zablokowane statki                              |
| `pending`                    | Wyświetla oczekujące żądania zatwierdzenia                        |

Bez skonfigurowanego `ownerShip` nieautoryzowane wiadomości prywatne i wzmianki na kanałach są po prostu odrzucane i rejestrowane;
monit o zatwierdzenie nie jest wyświetlany.

## Ustawienia automatycznego akceptowania

Automatycznie akceptuj zaproszenia do wiadomości prywatnych od statków już znajdujących się w `dmAllowlist` (właściciel jest zawsze akceptowany automatycznie
niezależnie od tej flagi):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Automatycznie akceptuj zaproszenia do grup od statków z listy dozwolonych (bezpieczne odrzucanie: przy `autoAcceptGroupInvites: true` i
pustej `groupInviteAllowlist` żadne zaproszenie od statku innego niż właściciel nie zostanie zaakceptowane):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Przeładowywanie na gorąco przez magazyn ustawień Urbit

Większość powyższych ustawień (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) jest podczas pierwszego uruchomienia kopiowana do agenta
`%settings` statku (pulpit `moltbot`, zasobnik `tlon`), a następnie odczytywana stamtąd na bieżąco,
dzięki czemu zmiany wprowadzone przez klienta Landscape lub polecenia ustawień dołączonej umiejętności są stosowane bez
ponownego uruchamiania Gateway. `channelRules` i oczekujące zatwierdzenia również są tam utrwalane jako JSON. Konfiguracja
plikowa pozostaje źródłem prawdy dla wartości, które nigdy nie zostały zapisane w magazynie ustawień.

## Miejsca docelowe dostarczania (CLI/Cron)

Używaj z `openclaw message send` lub dostarczaniem przez Cron:

- Wiadomość prywatna: `~sampel-palnet` lub `dm/~sampel-palnet`
- Grupa: `chat/~host-ship/channel` lub `group:~host-ship/channel`

## Dołączona umiejętność

Plugin zawiera [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), narzędzie CLI do
bezpośrednich operacji Urbit, dostępne automatycznie po zainstalowaniu pluginu:

- **Aktywność**: wzmianki, odpowiedzi, nieprzeczytane wiadomości
- **Kanały**: wyświetlanie, tworzenie, zmiana nazw
- **Kontakty**: wyświetlanie/pobieranie/aktualizowanie profili
- **Grupy**: tworzenie, dołączanie, przepływy zaproszeń/żądań, role
- **Hooki**: zarządzanie hookami kanałów
- **Wiadomości**: historia, wyszukiwanie
- **Wiadomości prywatne**: wysyłanie, reagowanie, akceptowanie/odrzucanie
- **Wpisy**: reagowanie, usuwanie
- **Notatnik**: publikowanie na kanałach dziennika
- **Ustawienia**: przeładowywanie konfiguracji pluginu na gorąco przez opisany powyżej magazyn ustawień

## Możliwości

| Funkcja             | Stan                                                    |
| ------------------- | ------------------------------------------------------- |
| Wiadomości prywatne | Obsługiwane                                              |
| Grupy/kanały        | Obsługiwane (domyślnie wymagają wzmianki)               |
| Wątki               | Obsługiwane (po dołączeniu nadal w nich odpowiada)       |
| Tekst sformatowany  | Markdown konwertowany do natywnego formatu Tlon          |
| Obrazy              | Przychodzące są pobierane, wychodzące są przesyłane      |
| Reakcje             | Tylko przez [dołączoną umiejętność](#bundled-skill)      |
| Ankiety             | Nieobsługiwane                                           |
| Polecenia natywne   | Domyślnie dostępne tylko dla właściciela                 |

## Rozwiązywanie problemów

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Typowe problemy:

- **Ignorowane wiadomości prywatne**: nadawcy nie ma w `dmAllowlist` i nie skonfigurowano `ownerShip` na potrzeby przepływu zatwierdzania.
- **Ignorowane wiadomości grupowe**: kanał nie został wykryty ani przypięty lub nadawca nie przechodzi autoryzacji, a brak
  `ownerShip`, który mógłby dodać zatwierdzenie do kolejki.
- **Błędy połączenia**: sprawdź, czy adres URL statku jest osiągalny; ustaw
  `network.dangerouslyAllowPrivateNetwork` dla statków lokalnych.
- **Błędy uwierzytelniania**: kody logowania są rotowane — skopiuj aktualny kod ze swojego statku.

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

| Klucz                                                  | Znaczenie                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Włącza/wyłącza uruchamianie kanału.                                  |
| `channels.tlon.ship`                                   | Nazwa statku Urbit bota (np. `~sampel-palnet`).                       |
| `channels.tlon.url`                                    | Adres URL statku (np. `https://sampel-palnet.tlon.network`).         |
| `channels.tlon.code`                                   | Kod logowania statku.                                                |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Zezwala na adresy URL statków w localhost/LAN (jawne włączenie SSRF). |
| `channels.tlon.ownerShip`                              | Statek właściciela: zawsze autoryzowany, otrzymuje żądania zatwierdzenia. |
| `channels.tlon.dmAllowlist`                            | Statki mogące wysyłać wiadomości prywatne (pusta = żadne poza właścicielem). |
| `channels.tlon.autoAcceptDmInvites`                    | Automatycznie akceptuje wiadomości prywatne od statków z `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Automatycznie akceptuje zaproszenia do grup od statków z `groupInviteAllowlist`. |
| `channels.tlon.groupInviteAllowlist`                   | Statki, których zaproszenia do grup są automatycznie akceptowane.     |
| `channels.tlon.autoDiscoverChannels`                   | Automatycznie wykrywa dołączone kanały grupowe (domyślnie: `false`).  |
| `channels.tlon.groupChannels`                          | Ręcznie przypięte gniazda kanałów.                                   |
| `channels.tlon.defaultAuthorizedShips`                 | Statki autoryzowane dla wszystkich kanałów (używane, gdy żadna reguła nie pasuje). |
| `channels.tlon.authorization.channelRules`             | Tryb autoryzacji i lista dozwolonych dla poszczególnych gniazd kanałów. |
| `channels.tlon.showModelSignature`                     | Dodaje `_[Wygenerowano przez <model>]_` do odpowiedzi.                |
| `channels.tlon.responsePrefix`                         | Statyczny prefiks dodawany na początku odpowiedzi wychodzących.       |
| `channels.tlon.accounts.<id>`                          | Dodatkowe nazwane konta (konfiguracje z wieloma statkami).            |

## Uwagi

- Odpowiedzi grupowe wymagają wzmianki @ (np. `~your-bot-ship`), chyba że bot dołączył już do danego wątku.
- Odpowiedzi w wątkach trafiają do wątku; bot otrzymuje również ostatnie 10 wiadomości z kontekstu wątku, dodanych
  na początku kontekstu agenta.
- Tekst sformatowany (pogrubienie, kursywa, kod, nagłówki, listy) jest konwertowany do natywnego formatu Tlon.
- Wysłanie wiadomości przychodzącej z prośbą o podsumowanie kanału (na przykład „podsumuj ten
  kanał”) uruchamia wbudowane podsumowywanie historii zamiast zwykłego przepływu odpowiedzi.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i wymóg wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i zabezpieczanie
