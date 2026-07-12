---
read_when:
    - Zatwierdzasz żądania parowania urządzeń
    - Musisz rotować lub unieważniać tokeny urządzeń
summary: Dokumentacja CLI dla `openclaw devices` (parowanie urządzeń oraz rotacja/unieważnianie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-07-12T14:54:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami przypisanymi do urządzeń.

## Typowe opcje

- `--url <url>`: adres URL WebSocket Gateway (domyślnie `gateway.remote.url`, jeśli skonfigurowano)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (uwierzytelnianie hasłem)
- `--timeout <ms>`: limit czasu RPC
- `--json`: dane wyjściowe JSON (zalecane w skryptach)

<Warning>
Po ustawieniu `--url` CLI nie korzysta awaryjnie z danych uwierzytelniających z konfiguracji ani zmiennych środowiskowych. Jawnie przekaż `--token` lub `--password`; w przeciwnym razie polecenie zakończy się błędem.
</Warning>

## Polecenia

### `openclaw devices list`

Wyświetl oczekujące żądania parowania i sparowane urządzenia.

```bash
openclaw devices list
openclaw devices list --json
```

W przypadku oczekującego żądania dotyczącego już sparowanego urządzenia dane wyjściowe pokazują żądany dostęp obok obecnie zatwierdzonego dostępu urządzenia, dzięki czemu rozszerzenia zakresu lub roli są widoczne i nie wyglądają jak utracone parowanie.

Nazwy wyświetlane sparowanych urządzeń są wybierane według następującej kolejności: etykieta operatora (`operatorLabel` z `devices rename`), następnie `displayName` klienta, potem `clientId`, a na końcu `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Zatwierdź oczekujące żądanie parowania na podstawie dokładnego `requestId`. Pominięcie `requestId` lub przekazanie `--latest` powoduje tylko wyświetlenie podglądu najnowszego oczekującego żądania i zakończenie działania (kod 1); aby zatwierdzić żądanie, uruchom polecenie ponownie z dokładnym identyfikatorem żądania.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Jeśli urządzenie ponowi próbę parowania ze zmienionymi szczegółami uwierzytelniania (rolą, zakresami lub kluczem publicznym), OpenClaw zastąpi poprzedni oczekujący wpis nowym `requestId`. Uruchom `openclaw devices list` bezpośrednio przed zatwierdzeniem, aby uzyskać bieżący identyfikator.
</Note>

Zasady zatwierdzania:

- Jeśli urządzenie jest już sparowane i żąda szerszych zakresów lub innej roli, OpenClaw zachowuje dotychczasowe zatwierdzenie i tworzy nowe oczekujące żądanie rozszerzenia uprawnień. Przed zatwierdzeniem porównaj `Requested` z `Approved` w `openclaw devices list` lub wyświetl podgląd za pomocą `--latest`.
- Zatwierdzenie roli `node` lub innej roli niebędącej operatorem wymaga `operator.admin`. `operator.pairing` wystarcza do zatwierdzania urządzeń operatora, ale tylko wtedy, gdy żądane zakresy operatora mieszczą się w zakresach własnych wywołującego. Zobacz [Zakresy operatora](/pl/gateway/operator-scopes).
- Jeśli skonfigurowano `gateway.nodes.pairing.autoApproveCidrs`, pierwsze żądania z `role: node` pochodzące z pasujących adresów IP klientów mogą zostać automatycznie zatwierdzone, zanim pojawią się na tej liście. Funkcja jest domyślnie wyłączona; nigdy nie dotyczy klientów operatora/przeglądarki ani żądań rozszerzenia uprawnień.
- `gateway.nodes.pairing.sshVerify` (domyślnie włączone) automatycznie zatwierdza pierwsze żądania z `role: node`, gdy Gateway zweryfikuje klucz urządzenia przez SSH na hoście węzła. Dlatego żądania mogą zostać zatwierdzone krótko po pojawieniu się. Ustaw `sshVerify: false`, aby wyłączyć weryfikację SSH; jest ona niezależna od `autoApproveCidrs`, więc wyłącz również tę opcję, jeśli parowanie ma odbywać się wyłącznie ręcznie.

### `openclaw devices reject <requestId>`

Odrzuć oczekujące żądanie parowania urządzenia.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Usuń jeden wpis sparowanego urządzenia.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Wywołujący uwierzytelniony tokenem sparowanego urządzenia może usunąć tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Przypisz etykietę operatora do sparowanego urządzenia. Etykiety są stanem po stronie właściciela: pozostają zachowane po naprawie parowania i ponownym zatwierdzeniu ról oraz nie zmieniają stabilnego `deviceId`.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` jest wymagane, przycinane z otaczających białych znaków, nie może być puste i może mieć najwyżej 64 znaki.
- Interfejsy wyświetlające dane (lista CLI, wykaz w interfejsie Control UI) preferują etykietę operatora zamiast nazwy wyświetlanej zgłoszonej przez klienta.
- Wywołujący korzystający ze sparowanego urządzenia bez uprawnień administratora może zmienić nazwę tylko **własnego** urządzenia. Zmiana nazwy innego urządzenia wymaga `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Zbiorczo usuń sparowane urządzenia. Wymaga `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

Opcja `--pending` odrzuca również wszystkie oczekujące żądania parowania.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Zmień token urządzenia dla roli, opcjonalnie aktualizując jego zakresy.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Rola docelowa musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia; zmiana tokenu nie może utworzyć nowej, niezatwierdzonej roli.
- Pominięcie `--scope` powoduje ponowne użycie zapisanych w pamięci podręcznej zatwierdzonych zakresów przechowywanego tokenu podczas kolejnych ponownych połączeń. Przekazanie jawnych wartości `--scope` zastępuje zapisany zestaw zakresów używany przy przyszłych ponownych połączeniach z tokenem z pamięci podręcznej.
- Wywołujący korzystający ze sparowanego urządzenia bez uprawnień administratora może zmienić tylko token **własnego** urządzenia, a docelowy zestaw zakresów musi mieścić się w jego własnych zakresach operatora; zmiana tokenu nie może utworzyć ani zachować tokenu o szerszych uprawnieniach niż już posiadane przez wywołującego.

Zwraca metadane zmiany tokenu w formacie JSON. Jeśli wywołujący zmienia własny token podczas uwierzytelnienia tym tokenem urządzenia, odpowiedź zawiera token zastępczy, aby klient mógł go zapisać przed ponownym połączeniem. Zmiany wykonywane współdzielonymi poświadczeniami lub przez administratora nigdy nie zwracają tokenu okaziciela.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla roli.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Wywołujący korzystający ze sparowanego urządzenia bez uprawnień administratora może unieważnić tylko token **własnego** urządzenia. Unieważnienie tokenu innego urządzenia wymaga `operator.admin`. Docelowy zestaw zakresów musi również mieścić się w zakresach operatora wywołującego; wywołujący mający wyłącznie uprawnienia do parowania nie może unieważniać tokenów operatora z uprawnieniami administratora lub zapisu.

## Uwagi

- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`). Role urządzeń niebędące operatorem zawsze wymagają `operator.admin`; zobacz [Zakresy operatora](/pl/gateway/operator-scopes).
- Zmiana i unieważnianie tokenów pozostają w zatwierdzonym zestawie ról parowania urządzenia oraz w bazowym zestawie zakresów. Przypadkowy wpis tokenu w pamięci podręcznej nie tworzy celu zarządzania tokenami.
- W sesjach tokenów sparowanych urządzeń zarządzanie innymi urządzeniami (`remove`, `rename`, `rotate`, `revoke`) jest ograniczone do własnego urządzenia, chyba że wywołujący ma `operator.admin`.
- Zmiana tokenu zwraca nowy token (dane wrażliwe) — traktuj go jak sekret.
- Jeśli zakres parowania jest niedostępny przez local loopback i nie przekazano jawnie `--url`, polecenia `list`/`approve` mogą skorzystać awaryjnie z lokalnego stanu parowania.

## Lista kontrolna odzyskiwania po rozbieżności tokenów

Użyj tej procedury, gdy interfejs Control UI lub inni klienci nadal zgłaszają błędy `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` albo `AUTH_SCOPE_MISMATCH`.

1. Potwierdź bieżące źródło tokenu Gateway:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Wyświetl sparowane urządzenia i znajdź identyfikator urządzenia, którego dotyczy problem:

   ```bash
   openclaw devices list
   ```

3. Zmień token operatora dla tego urządzenia:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Jeśli zmiana tokenu nie wystarczy, usuń nieaktualne parowanie i zatwierdź je ponownie:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Ponów próbę połączenia klienta przy użyciu bieżącego współdzielonego tokenu lub hasła.

Uwagi:

- Standardowa kolejność uwierzytelniania przy ponownym połączeniu: najpierw jawny współdzielony token lub hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token inicjalizacyjny.
- Zaufany mechanizm odzyskiwania po błędzie `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem współdzielony token i zapisany token urządzenia w ramach jednej ograniczonej próby ponowienia.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie obejmuje żądanego zestawu zakresów; przed zmianą współdzielonego uwierzytelniania Gateway popraw kontrakt zatwierdzania parowania i zakresów.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem panelu](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Zatwierdzanie przy pierwszym uruchomieniu Paperclip / `openclaw_gateway`

Agenci Paperclip łączący się przez adapter `openclaw_gateway` przechodzą ten sam proces zatwierdzania parowania urządzenia przy pierwszym uruchomieniu co każdy inny nowy klient. Jeśli Paperclip zgłosi `openclaw_gateway_pairing_required`, zatwierdź oczekujące urządzenie i ponów próbę.

```bash
openclaw devices approve --latest
```

Podgląd wyświetla dokładne polecenie `openclaw devices approve <requestId>`; zweryfikuj szczegóły, a następnie uruchom to polecenie ponownie z identyfikatorem żądania, aby je zatwierdzić. W przypadku zdalnego Gateway lub jawnych danych uwierzytelniających przekaż te same opcje podczas podglądu i zatwierdzania:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Aby uniknąć ponownego zatwierdzania po każdym restarcie, skonfiguruj trwałe `adapterConfig.devicePrivateKeyPem` w Paperclip, zamiast pozwalać mu generować nową tymczasową tożsamość urządzenia przy każdym uruchomieniu:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Jeśli zatwierdzanie nadal kończy się niepowodzeniem, najpierw uruchom `openclaw devices list`, aby potwierdzić istnienie oczekującego żądania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
