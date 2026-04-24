---
read_when:
    - Praca nad funkcjami kanału Tlon/Urbit
summary: Status obsługi, możliwości i konfiguracja Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-24T09:00:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon to zdecentralizowany komunikator zbudowany na Urbit. OpenClaw łączy się z Twoim shipem Urbit i może
odpowiadać na wiadomości DM oraz wiadomości na czacie grupowym. Odpowiedzi grupowe domyślnie wymagają
wzmianki @ i mogą być dodatkowo ograniczane przez listy dozwolonych.

Status: dołączony Plugin. Obsługiwane są wiadomości DM, wzmianki grupowe, odpowiedzi w wątkach, formatowanie tekstu rozszerzonego oraz
przesyłanie obrazów. Reakcje i ankiety nie są jeszcze obsługiwane.

## Dołączony Plugin

Tlon jest dostarczany jako dołączony Plugin w obecnych wydaniach OpenClaw, więc zwykłe spakowane
kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Tlon, zainstaluj go
ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/tlon
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Konfiguracja

1. Upewnij się, że Plugin Tlon jest dostępny.
   - Obecne spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zbierz URL swojego shipa i kod logowania.
3. Skonfiguruj `channels.tlon`.
4. Uruchom ponownie Gateway.
5. Wyślij wiadomość DM do bota lub wspomnij go w kanale grupowym.

Minimalna konfiguracja (jedno konto):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // zalecane: Twój ship, zawsze dozwolony
    },
  },
}
```

## Shipy prywatne/LAN

Domyślnie OpenClaw blokuje prywatne/wewnętrzne nazwy hostów i zakresy IP w celu ochrony SSRF.
Jeśli Twój ship działa w sieci prywatnej (localhost, adres IP LAN lub wewnętrzna nazwa hosta),
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
dla żądań do URL Twojego shipa.

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

Lista dozwolonych DM (pusta = brak dozwolonych DM, użyj `ownerShip` dla przepływu zatwierdzania):

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

## System właściciela i zatwierdzania

Ustaw ship właściciela, aby otrzymywać prośby o zatwierdzenie, gdy nieautoryzowani użytkownicy próbują wejść w interakcję:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship właściciela jest **automatycznie autoryzowany wszędzie** — zaproszenia do DM są automatycznie akceptowane, a
wiadomości na kanałach są zawsze dozwolone. Nie musisz dodawać właściciela do `dmAllowlist` ani
`defaultAuthorizedShips`.

Jeśli jest ustawiony, właściciel otrzymuje powiadomienia DM o:

- żądaniach DM od shipów, których nie ma na liście dozwolonych
- wzmiankach na kanałach bez autoryzacji
- żądaniach zaproszeń do grup

## Ustawienia automatycznej akceptacji

Automatyczna akceptacja zaproszeń DM (dla shipów z `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Automatyczna akceptacja zaproszeń grupowych:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Cele dostarczania (CLI/Cron)

Używaj ich z `openclaw message send` lub dostarczaniem Cron:

- DM: `~sampel-palnet` lub `dm/~sampel-palnet`
- Grupa: `chat/~host-ship/channel` lub `group:~host-ship/channel`

## Dołączone Skills

Plugin Tlon zawiera dołączone Skills ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
które zapewniają dostęp CLI do operacji Tlon:

- **Kontakty**: pobieranie/aktualizowanie profili, wyświetlanie kontaktów
- **Kanały**: wyświetlanie listy, tworzenie, publikowanie wiadomości, pobieranie historii
- **Grupy**: wyświetlanie listy, tworzenie, zarządzanie członkami
- **DM**: wysyłanie wiadomości, reagowanie na wiadomości
- **Reakcje**: dodawanie/usuwanie reakcji emoji do postów i wiadomości DM
- **Ustawienia**: zarządzanie uprawnieniami Pluginu przez polecenia slash

Skills są automatycznie dostępne po zainstalowaniu Pluginu.

## Możliwości

| Funkcja          | Status                                  |
| ---------------- | --------------------------------------- |
| Wiadomości bezpośrednie | ✅ Obsługiwane                    |
| Grupy/kanały     | ✅ Obsługiwane (domyślnie ograniczane wzmianką) |
| Wątki            | ✅ Obsługiwane (automatyczne odpowiedzi w wątku) |
| Tekst rozszerzony | ✅ Markdown konwertowany do formatu Tlon |
| Obrazy           | ✅ Przesyłane do magazynu Tlon           |
| Reakcje          | ✅ Przez [dołączone Skills](#dołączone-skills) |
| Ankiety          | ❌ Jeszcze nieobsługiwane                |
| Polecenia natywne | ✅ Obsługiwane (domyślnie tylko dla właściciela) |

## Rozwiązywanie problemów

Najpierw uruchom tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Typowe awarie:

- **DM są ignorowane**: nadawcy nie ma w `dmAllowlist` i nie skonfigurowano `ownerShip` dla przepływu zatwierdzania.
- **Wiadomości grupowe są ignorowane**: kanał nie został wykryty lub nadawca nie jest autoryzowany.
- **Błędy połączenia**: sprawdź, czy URL shipa jest osiągalny; włącz `allowPrivateNetwork` dla shipów lokalnych.
- **Błędy uwierzytelniania**: sprawdź, czy kod logowania jest aktualny (kody się zmieniają).

## Odwołanie do konfiguracji

Pełna konfiguracja: [Configuration](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.tlon.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.tlon.ship`: nazwa shipa Urbit bota (np. `~sampel-palnet`).
- `channels.tlon.url`: URL shipa (np. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kod logowania shipa.
- `channels.tlon.allowPrivateNetwork`: zezwala na URL-e localhost/LAN (obejście SSRF).
- `channels.tlon.ownerShip`: ship właściciela dla systemu zatwierdzania (zawsze autoryzowany).
- `channels.tlon.dmAllowlist`: shipy, które mogą wysyłać DM (pusta = żaden).
- `channels.tlon.autoAcceptDmInvites`: automatycznie akceptuje DM od shipów z listy dozwolonych.
- `channels.tlon.autoAcceptGroupInvites`: automatycznie akceptuje wszystkie zaproszenia grupowe.
- `channels.tlon.autoDiscoverChannels`: automatycznie wykrywa kanały grupowe (domyślnie: true).
- `channels.tlon.groupChannels`: ręcznie przypięte nesti kanałów.
- `channels.tlon.defaultAuthorizedShips`: shipy autoryzowane dla wszystkich kanałów.
- `channels.tlon.authorization.channelRules`: reguły autoryzacji per kanał.
- `channels.tlon.showModelSignature`: dodaje nazwę modelu do wiadomości.

## Uwagi

- Odpowiedzi grupowe wymagają wzmianki (np. `~your-bot-ship`), aby odpowiedzieć.
- Odpowiedzi w wątkach: jeśli wiadomość przychodząca jest w wątku, OpenClaw odpowiada w tym wątku.
- Tekst rozszerzony: formatowanie Markdown (pogrubienie, kursywa, kod, nagłówki, listy) jest konwertowane do natywnego formatu Tlon.
- Obrazy: URL-e są przesyłane do magazynu Tlon i osadzane jako bloki obrazów.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ pairingu
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i ograniczanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
