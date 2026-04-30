---
read_when:
    - Praca nad funkcjami kanału Tlon/Urbit
summary: Status obsługi Tlon/Urbit, możliwości i konfiguracja
title: Tlon
x-i18n:
    generated_at: "2026-04-30T09:39:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon to zdecentralizowany komunikator zbudowany na Urbit. OpenClaw łączy się z Twoim statkiem Urbit i może
odpowiadać na wiadomości prywatne oraz wiadomości czatu grupowego. Odpowiedzi grupowe domyślnie wymagają wzmianki @ i mogą
być dodatkowo ograniczane za pomocą list dozwolonych.

Status: dołączony plugin. Obsługiwane są wiadomości prywatne, wzmianki grupowe, odpowiedzi w wątkach, formatowanie tekstu sformatowanego i
przesyłanie obrazów. Reakcje i ankiety nie są jeszcze obsługiwane.

## Dołączony plugin

Tlon jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe spakowane
kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub instalacji niestandardowej, która wyklucza Tlon, zainstaluj
bieżący pakiet npm, gdy zostanie opublikowany:

Instalacja przez CLI (rejestr npm, gdy istnieje bieżący pakiet):

```bash
openclaw plugins install @openclaw/tlon
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj bieżącej spakowanej
kompilacji OpenClaw albo ścieżki lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie
opublikowany.

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Konfiguracja

1. Upewnij się, że plugin Tlon jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zbierz URL statku i kod logowania.
3. Skonfiguruj `channels.tlon`.
4. Uruchom ponownie Gateway.
5. Wyślij wiadomość prywatną do bota albo wspomnij o nim w kanale grupowym.

Minimalna konfiguracja (pojedyncze konto):

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

## Statki prywatne/LAN

Domyślnie OpenClaw blokuje prywatne/wewnętrzne nazwy hostów i zakresy adresów IP w celu ochrony przed SSRF.
Jeśli Twój statek działa w sieci prywatnej (localhost, adres IP w LAN albo wewnętrzna nazwa hosta),
musisz jawnie wyrazić na to zgodę:

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

⚠️ Włączaj to tylko wtedy, gdy ufasz swojej sieci lokalnej. To ustawienie wyłącza zabezpieczenia SSRF
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

Wyłączenie automatycznego wykrywania:

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

Lista dozwolonych wiadomości prywatnych (pusta = brak dozwolonych wiadomości prywatnych, użyj `ownerShip` dla przepływu zatwierdzania):

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

Statek właściciela jest **automatycznie autoryzowany wszędzie** — zaproszenia do wiadomości prywatnych są automatycznie akceptowane, a
wiadomości w kanałach są zawsze dozwolone. Nie musisz dodawać właściciela do `dmAllowlist` ani
`defaultAuthorizedShips`.

Po ustawieniu właściciel otrzymuje powiadomienia w wiadomościach prywatnych o:

- Prośbach o wiadomość prywatną od statków spoza listy dozwolonych
- Wzmiankach w kanałach bez autoryzacji
- Prośbach o zaproszenie do grupy

## Ustawienia automatycznej akceptacji

Automatyczne akceptowanie zaproszeń do wiadomości prywatnych (dla statków na liście dozwolonych):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Automatyczne akceptowanie zaproszeń do grup:

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

- Wiadomość prywatna: `~sampel-palnet` lub `dm/~sampel-palnet`
- Grupa: `chat/~host-ship/channel` lub `group:~host-ship/channel`

## Dołączony skill

Plugin Tlon zawiera dołączony skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
który zapewnia dostęp przez CLI do operacji Tlon:

- **Kontakty**: pobieranie/aktualizowanie profili, lista kontaktów
- **Kanały**: lista, tworzenie, publikowanie wiadomości, pobieranie historii
- **Grupy**: lista, tworzenie, zarządzanie członkami
- **Wiadomości prywatne**: wysyłanie wiadomości, reagowanie na wiadomości
- **Reakcje**: dodawanie/usuwanie reakcji emoji do postów i wiadomości prywatnych
- **Ustawienia**: zarządzanie uprawnieniami pluginu za pomocą poleceń ukośnika

Skill jest automatycznie dostępny po zainstalowaniu pluginu.

## Możliwości

| Funkcja            | Status                                             |
| ------------------ | -------------------------------------------------- |
| Wiadomości prywatne | ✅ Obsługiwane                                    |
| Grupy/kanały       | ✅ Obsługiwane (domyślnie wymagają wzmianki)       |
| Wątki              | ✅ Obsługiwane (automatyczne odpowiedzi w wątku)   |
| Tekst sformatowany | ✅ Markdown konwertowany do formatu Tlon           |
| Obrazy             | ✅ Przesyłane do pamięci Tlon                      |
| Reakcje            | ✅ Przez [dołączony skill](#bundled-skill)         |
| Ankiety            | ❌ Jeszcze nieobsługiwane                          |
| Polecenia natywne  | ✅ Obsługiwane (domyślnie tylko właściciel)        |

## Rozwiązywanie problemów

Najpierw uruchom tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Typowe awarie:

- **Wiadomości prywatne ignorowane**: nadawcy nie ma w `dmAllowlist` i nie skonfigurowano `ownerShip` dla przepływu zatwierdzania.
- **Wiadomości grupowe ignorowane**: kanał nie został wykryty albo nadawca nie jest autoryzowany.
- **Błędy połączenia**: sprawdź, czy URL statku jest osiągalny; włącz `allowPrivateNetwork` dla statków lokalnych.
- **Błędy uwierzytelniania**: sprawdź, czy kod logowania jest aktualny (kody rotują).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.tlon.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.tlon.ship`: nazwa statku Urbit bota (np. `~sampel-palnet`).
- `channels.tlon.url`: URL statku (np. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kod logowania statku.
- `channels.tlon.allowPrivateNetwork`: zezwala na adresy URL localhost/LAN (obejście SSRF).
- `channels.tlon.ownerShip`: statek właściciela dla systemu zatwierdzania (zawsze autoryzowany).
- `channels.tlon.dmAllowlist`: statki, które mogą wysyłać wiadomości prywatne (puste = żadne).
- `channels.tlon.autoAcceptDmInvites`: automatycznie akceptuje wiadomości prywatne od statków z listy dozwolonych.
- `channels.tlon.autoAcceptGroupInvites`: automatycznie akceptuje wszystkie zaproszenia do grup.
- `channels.tlon.autoDiscoverChannels`: automatycznie wykrywa kanały grupowe (domyślnie: true).
- `channels.tlon.groupChannels`: ręcznie przypięte zagnieżdżenia kanałów.
- `channels.tlon.defaultAuthorizedShips`: statki autoryzowane dla wszystkich kanałów.
- `channels.tlon.authorization.channelRules`: reguły uwierzytelniania dla poszczególnych kanałów.
- `channels.tlon.showModelSignature`: dołącza nazwę modelu do wiadomości.

## Uwagi

- Odpowiedzi grupowe wymagają wzmianki (np. `~your-bot-ship`), aby odpowiedzieć.
- Odpowiedzi w wątkach: jeśli wiadomość przychodząca jest w wątku, OpenClaw odpowiada w wątku.
- Tekst sformatowany: formatowanie Markdown (pogrubienie, kursywa, kod, nagłówki, listy) jest konwertowane do natywnego formatu Tlon.
- Obrazy: adresy URL są przesyłane do pamięci Tlon i osadzane jako bloki obrazów.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie w wiadomościach prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie przez wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
