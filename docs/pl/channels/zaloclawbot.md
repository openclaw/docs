---
read_when:
    - Chcesz osobistego bota asystenta Zalo z logowaniem za pomocą kodu QR
    - Instalujesz lub rozwiązujesz problemy z pluginem kanału openclaw-zaloclawbot
summary: Konfiguracja kanału Zalo ClawBot przez zewnętrzny Plugin openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:15:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw łączy się z Zalo ClawBot przez wymieniony w katalogu zewnętrzny plugin
`@zalo-platforms/openclaw-zaloclawbot`. Logowanie używa kodu QR Zalo Mini App.

## Zgodność

| Wersja Plugin | Wersja OpenClaw | npm dist-tag | Status        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | Aktywny / Beta |

## Wymagania wstępne

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) musi być zainstalowany (`openclaw` CLI dostępne).
- Konto Zalo na urządzeniu mobilnym do zeskanowania kodu QR logowania.

## Instalacja z użyciem onboard (zalecane)

Uruchom kreator wdrażania OpenClaw i wybierz **Zalo ClawBot** z menu kanałów:

```bash
openclaw onboard
```

Kreator instaluje plugin z oficjalnego katalogu (ze zweryfikowaną integralnością), wyświetla kod QR logowania bezpośrednio w terminalu i kończy konfigurację kanału po zeskanowaniu go aplikacją Zalo. Żadne dodatkowe polecenia nie są potrzebne.

## Instalacja ręczna

Aby dodać kanał do już wdrożonej bramy Gateway, wykonaj te kroki:

### 1. Zainstaluj plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Użyj dokładnie przypiętej wersji pokazanej powyżej (odpowiada oficjalnemu wpisowi w katalogu), aby OpenClaw zweryfikował pakiet względem skrótu integralności katalogu podczas instalacji.

### 2. Włącz plugin w konfiguracji

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Wygeneruj kod QR i zaloguj się

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Zeskanuj kod QR wyświetlony w terminalu za pomocą aplikacji mobilnej Zalo, zaakceptuj Warunki korzystania w Zalo Mini App i autoryzuj sesję.

### 4. Uruchom ponownie Gateway

```bash
openclaw gateway restart
```

---

## Jak to działa

W przeciwieństwie do standardowego kanału deweloperskiego Zalo, który wymaga zarejestrowania własnego Zalo Official Account (OA) i wklejenia statycznych poświadczeń deweloperskich, Zalo ClawBot działa jako **osobisty asystent powiązany z właścicielem**, korzystając ze współdzielonej, oficjalnej infrastruktury:

1. **Bezpieczne wdrażanie:** Kod QR prowadzi do bezpiecznej Zalo Mini App, która wiąże nowo utworzonego, prywatnego bota działającego pod współdzielonym oficjalnym OA bezpośrednio z Twoim Zalo User ID.
2. **Prywatność powiązana z właścicielem:** Z założenia bot może komunikować się _wyłącznie_ ze swoim właścicielem. Wiadomości od innych użytkowników są odrzucane na poziomie platformy, dzięki czemu połączenie jest prywatne i bezpieczne.
3. **Oficjalna ścieżka API:** Plugin używa API Zalo Bot Platform zamiast
   automatyzacji przeglądarki lub sesji webowej.

## Pod maską

Plugin Zalo ClawBot komunikuje się z API Zalo przez trwałą pętlę komunikatów long-polling. Aby utrzymać czyste i lekkie środowisko uruchomieniowe:

- Połączenia long-poll korzystają z punktu końcowego `getUpdates`.
- Webhooks są domyślnie wyłączone dla lokalnych uruchomień Gateway na komputerze/terminalu.
- Wiadomości są przetwarzane po stronie klienta i mapowane bezpośrednio do lokalnego środowiska uruchomieniowego agenta.

Zewnętrzny plugin zarządza poświadczeniami bota w katalogu stanu OpenClaw.
Traktuj ten katalog jako poufny i obejmij go takimi samymi zasadami kontroli
dostępu oraz kopii zapasowych jak resztę stanu OpenClaw.

---

## Rozwiązywanie problemów

- **Limit czasu logowania QR:** Token logowania (`zbsk`) wygasa po 5 minutach ze względów bezpieczeństwa. Jeśli kod QR wygaśnie przed zeskanowaniem, po prostu uruchom ponownie polecenie logowania, aby wygenerować nowy.
- **Gateway nie ładuje się:** Upewnij się, że wersja hosta OpenClaw to `2026.4.10` lub nowsza. Starsze wersje nie obsługują rejestru instalacji zewnętrznych pluginów npm.
