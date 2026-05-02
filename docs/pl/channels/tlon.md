---
read_when:
    - Praca nad funkcjami kanału Tlon/Urbit
summary: Status obsługi Tlon/Urbit, możliwości i konfiguracja
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon to zdecentralizowany komunikator zbudowany na Urbit. OpenClaw łączy się z Twoim statkiem Urbit i może
odpowiadać na wiadomości DM oraz wiadomości czatu grupowego. Odpowiedzi grupowe domyślnie wymagają wzmianki @ i mogą
być dodatkowo ograniczone za pomocą list dozwolonych.

Status: dołączony plugin. Obsługiwane są DM, wzmianki grupowe, odpowiedzi w wątkach, formatowanie tekstu sformatowanego oraz
przesyłanie obrazów. Reakcje i ankiety nie są jeszcze obsługiwane.

## Dołączony plugin

Tlon jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe spakowane
kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji albo niestandardowej instalacji, która wyklucza Tlon, zainstaluj
bieżący pakiet npm:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/tlon
```

Użyj niekwalifikowanego pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Konfiguracja

1. Upewnij się, że plugin Tlon jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go dołączają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zbierz URL statku i kod logowania.
3. Skonfiguruj `channels.tlon`.
4. Uruchom ponownie gateway.
5. Wyślij DM do bota albo wspomnij o nim na kanale grupowym.

Minimalna konfiguracja (jedno konto):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Prywatne statki/LAN

Domyślnie OpenClaw blokuje prywatne/wewnętrzne nazwy hostów i zakresy adresów IP w celu ochrony przed SSRF.
Jeśli Twój statek działa w sieci prywatnej (localhost, adres IP LAN albo wewnętrzna nazwa hosta),
musisz jawnie wyrazić zgodę:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Dotyczy to adresów URL takich jak:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Włączaj to tylko wtedy, gdy ufasz swojej sieci lokalnej. To ustawienie wyłącza ochronę SSRF
dla żądań do URL Twojego statku.

## Kanały grupowe

Automatyczne wykrywanie jest domyślnie włączone. Możesz też przypiąć kanały ręcznie:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Wyłącz automatyczne wykrywanie:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Kontrola dostępu

Lista dozwolonych DM (pusta = DM niedozwolone, użyj `ownerShip` do przepływu zatwierdzania):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autoryzacja grupowa (domyślnie ograniczona):

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

## Właściciel i system zatwierdzania

Ustaw statek właściciela, aby otrzymywać prośby o zatwierdzenie, gdy nieautoryzowani użytkownicy próbują wejść w interakcję:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Statek właściciela jest **automatycznie autoryzowany wszędzie** — zaproszenia DM są automatycznie akceptowane, a
wiadomości kanałowe są zawsze dozwolone. Nie musisz dodawać właściciela do `dmAllowlist` ani
`defaultAuthorizedShips`.

Po ustawieniu właściciel otrzymuje powiadomienia DM dla:

- Próśb DM od statków spoza listy dozwolonych
- Wzmianek w kanałach bez autoryzacji
- Próśb o zaproszenie do grupy

## Ustawienia automatycznej akceptacji

Automatycznie akceptuj zaproszenia DM (dla statków w dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Automatycznie akceptuj zaproszenia do grup:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Cele dostarczania (CLI/cron)

Używaj ich z `openclaw message send` albo dostarczaniem cron:

- DM: `~sampel-palnet` albo `dm/~sampel-palnet`
- Grupa: `chat/~host-ship/channel` albo `group:~host-ship/channel`

## Dołączone skill

Plugin Tlon zawiera dołączone skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
które zapewnia dostęp CLI do operacji Tlon:

- **Kontakty**: pobieranie/aktualizowanie profili, lista kontaktów
- **Kanały**: lista, tworzenie, publikowanie wiadomości, pobieranie historii
- **Grupy**: lista, tworzenie, zarządzanie członkami
- **DM**: wysyłanie wiadomości, reagowanie na wiadomości
- **Reakcje**: dodawanie/usuwanie reakcji emoji do postów i DM
- **Ustawienia**: zarządzanie uprawnieniami pluginu przez polecenia slash

Skill jest automatycznie dostępne po zainstalowaniu pluginu.

## Możliwości

| Funkcja             | Status                                           |
| ------------------- | ------------------------------------------------ |
| Wiadomości bezpośrednie | ✅ Obsługiwane                               |
| Grupy/kanały        | ✅ Obsługiwane (domyślnie wymagają wzmianki)      |
| Wątki               | ✅ Obsługiwane (automatyczne odpowiedzi w wątku)  |
| Tekst sformatowany  | ✅ Markdown konwertowany do formatu Tlon          |
| Obrazy              | ✅ Przesyłane do pamięci Tlon                     |
| Reakcje             | ✅ Przez [dołączone skill](#bundled-skill)        |
| Ankiety             | ❌ Jeszcze nieobsługiwane                         |
| Polecenia natywne   | ✅ Obsługiwane (domyślnie tylko dla właściciela)  |

## Rozwiązywanie problemów

Najpierw uruchom tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Typowe awarie:

- **DM ignorowane**: nadawcy nie ma w `dmAllowlist` i nie skonfigurowano `ownerShip` dla przepływu zatwierdzania.
- **Wiadomości grupowe ignorowane**: kanał nie został wykryty albo nadawca nie jest autoryzowany.
- **Błędy połączenia**: sprawdź, czy URL statku jest osiągalny; włącz `allowPrivateNetwork` dla lokalnych statków.
- **Błędy uwierzytelniania**: sprawdź, czy kod logowania jest aktualny (kody się rotują).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.tlon.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.tlon.ship`: nazwa statku Urbit bota (np. `~sampel-palnet`).
- `channels.tlon.url`: URL statku (np. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kod logowania statku.
- `channels.tlon.allowPrivateNetwork`: zezwól na adresy URL localhost/LAN (obejście SSRF).
- `channels.tlon.ownerShip`: statek właściciela dla systemu zatwierdzania (zawsze autoryzowany).
- `channels.tlon.dmAllowlist`: statki, które mogą wysyłać DM (puste = żadne).
- `channels.tlon.autoAcceptDmInvites`: automatycznie akceptuj DM od statków z listy dozwolonych.
- `channels.tlon.autoAcceptGroupInvites`: automatycznie akceptuj wszystkie zaproszenia do grup.
- `channels.tlon.autoDiscoverChannels`: automatycznie wykrywaj kanały grupowe (domyślnie: true).
- `channels.tlon.groupChannels`: ręcznie przypięte zagnieżdżenia kanałów.
- `channels.tlon.defaultAuthorizedShips`: statki autoryzowane dla wszystkich kanałów.
- `channels.tlon.authorization.channelRules`: reguły uwierzytelniania dla poszczególnych kanałów.
- `channels.tlon.showModelSignature`: dołącz nazwę modelu do wiadomości.

## Uwagi

- Odpowiedzi grupowe wymagają wzmianki (np. `~your-bot-ship`), aby bot odpowiedział.
- Odpowiedzi w wątku: jeśli wiadomość przychodząca jest w wątku, OpenClaw odpowiada w tym wątku.
- Tekst sformatowany: formatowanie Markdown (pogrubienie, kursywa, kod, nagłówki, listy) jest konwertowane do natywnego formatu Tlon.
- Obrazy: adresy URL są przesyłane do pamięci Tlon i osadzane jako bloki obrazów.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i wymóg wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
