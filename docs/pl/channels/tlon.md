---
read_when:
    - Praca nad funkcjami kanału Tlon/Urbit
summary: Status obsługi Tlon/Urbit, możliwości i konfiguracja
title: Tlon
x-i18n:
    generated_at: "2026-04-05T13:46:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon to zdecentralizowany komunikator zbudowany na Urbit. OpenClaw łączy się z Twoim shipem Urbit i może
odpowiadać na DM oraz wiadomości na czatach grupowych. Odpowiedzi w grupach domyślnie wymagają wzmianki @ i mogą
być dodatkowo ograniczane za pomocą list dozwolonych.

Status: dołączony plugin. Obsługiwane są DM, wzmianki w grupach, odpowiedzi w wątkach, formatowanie tekstu sformatowanego oraz
przesyłanie obrazów. Reakcje i ankiety nie są jeszcze obsługiwane.

## Dołączony plugin

Tlon jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe spakowane
kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Tlon, zainstaluj go
ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/tlon
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Szczegóły: [Plugins](/tools/plugin)

## Konfiguracja

1. Upewnij się, że plugin Tlon jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zbierz URL swojego shipa i kod logowania.
3. Skonfiguruj `channels.tlon`.
4. Uruchom ponownie bramę.
5. Wyślij DM do bota lub wspomnij go na kanale grupowym.

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

## Prywatne/LAN shipy

Domyślnie OpenClaw blokuje prywatne/wewnętrzne nazwy hostów i zakresy IP w celu ochrony przed SSRF.
Jeśli Twój ship działa w sieci prywatnej (localhost, adres IP LAN lub wewnętrzna nazwa hosta),
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

Dotyczy to URL-i takich jak:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Włączaj to tylko wtedy, gdy ufasz swojej sieci lokalnej. To ustawienie wyłącza ochronę przed SSRF
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

Lista dozwolonych dla DM (pusta = brak dozwolonych DM, użyj `ownerShip` dla przepływu zatwierdzania):

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

Po ustawieniu właściciel otrzymuje powiadomienia DM dla:

- próśb o DM od shipów, których nie ma na liście dozwolonych
- wzmianek na kanałach bez autoryzacji
- próśb o zaproszenie do grupy

## Ustawienia automatycznej akceptacji

Automatyczna akceptacja zaproszeń do DM (dla shipów w `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Automatyczna akceptacja zaproszeń do grup:

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

Używaj ich z `openclaw message send` lub dostarczaniem cron:

- DM: `~sampel-palnet` lub `dm/~sampel-palnet`
- Grupa: `chat/~host-ship/channel` lub `group:~host-ship/channel`

## Dołączony Skill

Plugin Tlon zawiera dołączony Skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
który zapewnia dostęp przez CLI do operacji Tlon:

- **Kontakty**: pobieranie/aktualizowanie profili, wyświetlanie kontaktów
- **Kanały**: wyświetlanie, tworzenie, publikowanie wiadomości, pobieranie historii
- **Grupy**: wyświetlanie, tworzenie, zarządzanie członkami
- **DM**: wysyłanie wiadomości, reagowanie na wiadomości
- **Reakcje**: dodawanie/usuwanie reakcji emoji do postów i DM
- **Ustawienia**: zarządzanie uprawnieniami pluginu za pomocą poleceń slash

Skill jest automatycznie dostępny po zainstalowaniu pluginu.

## Możliwości

| Funkcja         | Status                                  |
| --------------- | --------------------------------------- |
| Wiadomości bezpośrednie | ✅ Obsługiwane                            |
| Grupy/kanały | ✅ Obsługiwane (domyślnie z bramkowaniem wzmianek) |
| Wątki         | ✅ Obsługiwane (automatyczne odpowiedzi w wątku)   |
| Tekst sformatowany       | ✅ Markdown konwertowany do formatu Tlon    |
| Obrazy          | ✅ Przesyłane do pamięci Tlon             |
| Reakcje       | ✅ Przez [dołączony Skill](#bundled-skill)  |
| Ankiety           | ❌ Jeszcze nieobsługiwane                    |
| Polecenia natywne | ✅ Obsługiwane (domyślnie tylko dla właściciela)    |

## Rozwiązywanie problemów

Najpierw uruchom tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Typowe błędy:

- **DM ignorowane**: nadawcy nie ma w `dmAllowlist` i nie skonfigurowano `ownerShip` dla przepływu zatwierdzania.
- **Wiadomości grupowe ignorowane**: kanał nie został wykryty lub nadawca nie jest autoryzowany.
- **Błędy połączenia**: sprawdź, czy URL shipa jest osiągalny; włącz `allowPrivateNetwork` dla lokalnych shipów.
- **Błędy uwierzytelniania**: sprawdź, czy kod logowania jest aktualny (kody są rotowane).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Configuration](/gateway/configuration)

Opcje dostawcy:

- `channels.tlon.enabled`: włączenie/wyłączenie uruchamiania kanału.
- `channels.tlon.ship`: nazwa shipa Urbit bota (np. `~sampel-palnet`).
- `channels.tlon.url`: URL shipa (np. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kod logowania do shipa.
- `channels.tlon.allowPrivateNetwork`: zezwól na URL-e localhost/LAN (obejście SSRF).
- `channels.tlon.ownerShip`: ship właściciela dla systemu zatwierdzania (zawsze autoryzowany).
- `channels.tlon.dmAllowlist`: shipy, które mogą wysyłać DM (puste = żadne).
- `channels.tlon.autoAcceptDmInvites`: automatycznie akceptuj DM od shipów z listy dozwolonych.
- `channels.tlon.autoAcceptGroupInvites`: automatycznie akceptuj wszystkie zaproszenia do grup.
- `channels.tlon.autoDiscoverChannels`: automatycznie wykrywaj kanały grupowe (domyślnie: true).
- `channels.tlon.groupChannels`: ręcznie przypięte gniazda kanałów.
- `channels.tlon.defaultAuthorizedShips`: shipy autoryzowane dla wszystkich kanałów.
- `channels.tlon.authorization.channelRules`: reguły autoryzacji dla poszczególnych kanałów.
- `channels.tlon.showModelSignature`: dołącz nazwę modelu do wiadomości.

## Uwagi

- Odpowiedzi w grupach wymagają wzmianki (np. `~your-bot-ship`), aby odpowiedzieć.
- Odpowiedzi w wątkach: jeśli wiadomość przychodząca jest w wątku, OpenClaw odpowiada w tym samym wątku.
- Tekst sformatowany: formatowanie Markdown (pogrubienie, kursywa, kod, nagłówki, listy) jest konwertowane do natywnego formatu Tlon.
- Obrazy: URL-e są przesyłane do pamięci Tlon i osadzane jako bloki obrazów.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
