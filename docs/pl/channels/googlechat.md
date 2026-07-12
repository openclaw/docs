---
read_when:
    - Praca nad funkcjami kanału Google Chat
summary: Stan obsługi, możliwości i konfiguracja aplikacji Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T14:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat działa jako oficjalny plugin `@openclaw/googlechat`: obsługuje wiadomości prywatne i pokoje za pośrednictwem webhooków Google Chat API (wyłącznie punkt końcowy HTTP, bez Pub/Sub).

## Instalacja

```bash
openclaw plugins install @openclaw/googlechat
```

Lokalna kopia robocza (w przypadku uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Szybka konfiguracja (dla początkujących)

1. Utwórz projekt Google Cloud i włącz **Google Chat API**.
   - Przejdź do: [Dane logowania Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Włącz API, jeśli nie jest jeszcze włączone.
2. Utwórz **Service Account**:
   - Kliknij **Create Credentials** > **Service Account**.
   - Nadaj mu dowolną nazwę (np. `openclaw-chat`).
   - Pozostaw uprawnienia i podmioty puste (**Continue**, a następnie **Done**).
3. Utwórz i pobierz **klucz JSON**:
   - Kliknij nowe konto usługi > kartę **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Zapisz pobrany plik JSON na hoście Gateway (np. `~/.openclaw/googlechat-service-account.json`).
5. Utwórz aplikację Google Chat w sekcji [Konfiguracja Chat w konsoli Google Cloud](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Uzupełnij **Application info** (nazwa aplikacji, adres URL awatara, opis).
   - Włącz **Interactive features**.
   - W sekcji **Functionality** zaznacz **Join spaces and group conversations**.
   - W sekcji **Connection settings** wybierz **HTTP endpoint URL**.
   - W sekcji **Triggers** wybierz **Use a common HTTP endpoint URL for all triggers** i ustaw publiczny adres URL Gateway z dopisanym `/googlechat` (zobacz [Publiczny adres URL](#public-url-webhook-only)).
   - W sekcji **Visibility** zaznacz **Make this Chat app available to specific people and groups in `<Your Domain>`** i wprowadź swój adres e-mail.
   - Kliknij **Save**.
6. Włącz aplikację: odśwież stronę, znajdź **App status**, ustaw **Live - available to users** i ponownie kliknij **Save**.
7. Skonfiguruj OpenClaw przy użyciu konta usługi i odbiorcy webhooka (muszą odpowiadać konfiguracji aplikacji Chat):
   - Zmienna środowiskowa: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (tylko konto domyślne) lub
   - Konfiguracja: zobacz [Najważniejsze ustawienia konfiguracji](#config-highlights). Polecenie `openclaw channels add --channel googlechat` przyjmuje również opcje `--audience-type`, `--audience`, `--webhook-path` i `--webhook-url`.
8. Uruchom Gateway. Google Chat będzie wysyłać żądania POST do ścieżki webhooka (domyślnie `/googlechat`).

## Dodawanie do Google Chat

Po uruchomieniu Gateway i dodaniu swojego adresu e-mail do listy widoczności:

1. Przejdź do [Google Chat](https://chat.google.com/).
2. Kliknij ikonę **+** (plus) obok **Direct Messages**.
3. Wyszukaj **nazwę aplikacji** skonfigurowaną w konsoli Google Cloud.
   - Bot _nie_ pojawia się na liście przeglądania Marketplace, ponieważ jest aplikacją prywatną; wyszukaj go według nazwy.
4. Wybierz bota, kliknij **Add** lub **Chat** i wyślij wiadomość.

## Publiczny adres URL (tylko Webhook)

Webhooki Google Chat wymagają publicznego punktu końcowego HTTPS. Ze względów bezpieczeństwa udostępnij w internecie **wyłącznie ścieżkę `/googlechat`**, a panel OpenClaw i pozostałe punkty końcowe pozostaw prywatne.

### Opcja A: Tailscale Funnel (zalecana)

Użyj Tailscale Serve do obsługi prywatnego panelu i Funnel do publicznej ścieżki webhooka.

1. Sprawdź, z jakim adresem jest powiązany Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   Zanotuj adres IP (np. `127.0.0.1`, `0.0.0.0` lub adres Tailscale `100.x.x.x`).

2. Udostępnij panel wyłącznie w sieci tailnet (port 8443):

   ```bash
   # Jeśli powiązano z hostem lokalnym (127.0.0.1 lub 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Jeśli powiązano wyłącznie z adresem IP Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Udostępnij publicznie wyłącznie ścieżkę webhooka:

   ```bash
   # Jeśli powiązano z hostem lokalnym (127.0.0.1 lub 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Jeśli powiązano wyłącznie z adresem IP Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Jeśli pojawi się monit, odwiedź adres URL autoryzacji wyświetlony w danych wyjściowych, aby włączyć Funnel dla tego węzła.

5. Zweryfikuj konfigurację:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Publiczny adres URL webhooka to `https://<node-name>.<tailnet>.ts.net/googlechat`; panel pozostaje dostępny wyłącznie w sieci tailnet pod adresem `https://<node-name>.<tailnet>.ts.net:8443/`. W konfiguracji aplikacji Google Chat użyj publicznego adresu URL (bez `:8443`).

> Uwaga: ta konfiguracja jest zachowywana po ponownym uruchomieniu. Aby ją później usunąć, użyj poleceń `tailscale funnel reset` i `tailscale serve reset`.

### Opcja B: odwrotne proxy (Caddy)

Przekazuj przez proxy wyłącznie ścieżkę webhooka:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Żądania do `your-domain.com/` są ignorowane lub zwracają błąd 404, natomiast żądania do `your-domain.com/googlechat` są kierowane do OpenClaw.

### Opcja C: Cloudflare Tunnel

Skonfiguruj reguły ruchu przychodzącego tunelu tak, aby kierowały wyłącznie ścieżkę webhooka:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Jak to działa

1. Google Chat wysyła dane JSON metodą POST do ścieżki webhooka Gateway (dozwolona jest tylko metoda POST, wymagany jest typ zawartości JSON, obowiązuje limit częstotliwości dla każdego adresu IP).
2. OpenClaw uwierzytelnia każde żądanie przed jego przekazaniem:
   - Zdarzenia aplikacji Chat zawierają `Authorization: Bearer <token>`; token jest weryfikowany przed przetworzeniem pełnej treści.
   - Zdarzenia dodatku Google Workspace zawierają token w treści (`authorizationEventObject.systemIdToken`) i przed weryfikacją są odczytywane z bardziej rygorystycznym limitem wstępnego uwierzytelniania (16 KB, 3 s).
3. Token jest sprawdzany względem `audienceType` i `audience`:
   - `audienceType: "app-url"` → odbiorcą jest adres URL HTTPS webhooka.
   - `audienceType: "project-number"` → odbiorcą jest numer projektu Cloud.
   - Tokeny dodatku używające `app-url` wymagają dodatkowo ustawienia `appPrincipal` na numeryczny identyfikator klienta OAuth 2.0 aplikacji (21 cyfr, nie adres e-mail); w przeciwnym razie weryfikacja kończy się niepowodzeniem, a ostrzeżenie zostaje zapisane w dzienniku.
4. Wiadomości są kierowane według pokoju:
   - Pokoje otrzymują osobne sesje `agent:<agentId>:googlechat:group:<spaceId>`; odpowiedzi trafiają do wątku wiadomości.
   - Wiadomości prywatne są domyślnie łączone z główną sesją agenta; ustaw `session.dmScope`, aby używać osobnych sesji wiadomości prywatnych dla poszczególnych rozmówców (zobacz [Sesja](/pl/concepts/session)).
5. Dostęp do wiadomości prywatnych domyślnie wymaga parowania. Nieznani nadawcy otrzymują kod parowania; zatwierdź go poleceniem:
   - `openclaw pairing approve googlechat <code>`
6. Pokoje grupowe domyślnie wymagają wzmianki @. Wzmianki są wykrywane na podstawie adnotacji Chat `USER_MENTION` wskazujących aplikację; ustaw `botUser` (np. `users/1234567890`), jeśli wykrywanie wymaga nazwy zasobu użytkownika aplikacji.
7. Gdy zatwierdzanie wykonania lub działania pluginu zostanie zainicjowane z Google Chat i skonfigurowano stabilnego zatwierdzającego `users/<id>`, OpenClaw publikuje natywną kartę zatwierdzania (`cardsV2`) w źródłowym pokoju lub wątku. Przyciski karty zawierają nieprzezroczyste tokeny wywołania zwrotnego; ręczny monit `/approve <id> <decision>` pojawia się tylko wtedy, gdy dostarczenie natywne jest niedostępne.

## Cele

Do dostarczania i list dozwolonych używaj następujących identyfikatorów:

- Wiadomości prywatne: `users/<userId>` (zalecane).
- Pokoje: `spaces/<spaceId>`.
- Zwykły adres e-mail `name@example.com` jest zmienny i służy do dopasowywania na liście dozwolonych wyłącznie wtedy, gdy ustawiono `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Przestarzałe: `users/<email>` jest traktowane jako identyfikator użytkownika, a nie wpis adresu e-mail na liście dozwolonych.
- Prefiksy `googlechat:`, `google-chat:` i `gchat:` są akceptowane i usuwane.

## Najważniejsze ustawienia konfiguracji

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // lub serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // tylko weryfikacja dodatku; numeryczny identyfikator klienta OAuth
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opcjonalne; ułatwia wykrywanie wzmianek
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Tylko krótkie odpowiedzi.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Uwagi:

- Dane logowania konta usługi: `serviceAccountFile` (ścieżka), `serviceAccount` (wbudowany ciąg JSON lub obiekt) albo `serviceAccountRef` (SecretRef zmiennej środowiskowej/pliku). Zmienne środowiskowe `GOOGLE_CHAT_SERVICE_ACCOUNT` (wbudowany JSON) i `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (ścieżka) dotyczą wyłącznie konta domyślnego. Konfiguracje wielu kont używają `channels.googlechat.accounts.<id>` z tymi samymi kluczami, w tym osobnym `serviceAccountRef` dla każdego konta.
- Domyślna ścieżka webhooka to `/googlechat`, gdy `webhookPath` nie jest ustawione; ścieżkę może również określać `webhookUrl`.
- Klucze grup muszą być stabilnymi identyfikatorami pokojów (`spaces/<spaceId>`). Klucze będące nazwami wyświetlanymi są przestarzałe i odpowiednio oznaczane w dzienniku.
- `dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych podmiotów na podstawie adresów e-mail na listach dozwolonych (awaryjny tryb zgodności); narzędzie diagnostyczne ostrzega o wpisach adresów e-mail.
- Działania reakcji Google Chat nie są udostępniane. Plugin używa uwierzytelniania konta usługi, natomiast punkty końcowe reakcji Google Chat wymagają uwierzytelniania użytkownika. Istniejąca konfiguracja `actions.reactions` jest akceptowana ze względu na zgodność, ale nie wywołuje żadnego efektu.
- Natywne karty zatwierdzania używają kliknięć przycisków Google Chat `cardsV2`, a nie zdarzeń reakcji. Zatwierdzający są pobierani z `dm.allowFrom` lub `defaultTo` i muszą mieć stabilne wartości numeryczne `users/<id>`.
- Działania wiadomości udostępniają wyłącznie tekstową operację `send`. Przesyłanie załączników w Google Chat wymaga uwierzytelniania użytkownika, natomiast ten plugin używa uwierzytelniania konta usługi, dlatego wychodzące przesyłanie plików nie jest udostępniane.
- `typingIndicator`: wartość `message` (domyślna) publikuje tekst zastępczy `_<Bot> pisze..._` i zastępuje go pierwszą odpowiedzią; `none` wyłącza tę funkcję; `reaction` wymaga OAuth użytkownika i przy uwierzytelnianiu konta usługi obecnie wraca do `message`, zapisując błąd w dzienniku.
- Załączniki przychodzące (pierwszy załącznik w każdej wiadomości) są pobierane przez Chat API do potoku multimediów z limitem `mediaMaxMb` (domyślnie 20).
- Wiadomości utworzone przez boty są domyślnie ignorowane. Po ustawieniu `allowBots: true` zaakceptowane wiadomości botów używają wspólnej [ochrony przed pętlą botów](/pl/channels/bot-loop-protection): skonfiguruj `channels.defaults.botLoopProtection`, a następnie zastąp ustawienie za pomocą `channels.googlechat.botLoopProtection` lub `channels.googlechat.groups.<space>.botLoopProtection`.

Szczegóły odwołań do sekretów: [Zarządzanie sekretami](/pl/gateway/secrets).

## Rozwiązywanie problemów

### 405 — metoda niedozwolona

Jeśli w Eksploratorze logów Google Cloud pojawiają się błędy takie jak:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Procedura obsługi webhooka nie jest zarejestrowana. Typowe przyczyny:

1. **Kanał nie jest skonfigurowany**: brakuje sekcji `channels.googlechat`. Sprawdź ją poleceniem:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jeśli polecenie zwróci „Config path not found”, dodaj konfigurację (zobacz [Najważniejsze ustawienia konfiguracji](#config-highlights)).

2. **Plugin nie jest włączony**: sprawdź jego stan:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jeśli wyświetlany jest stan „disabled”, dodaj `plugins.entries.googlechat.enabled: true` do konfiguracji.

3. **Gateway nie został ponownie uruchomiony** po zmianach konfiguracji:

   ```bash
   openclaw gateway restart
   ```

Sprawdź, czy kanał działa:

```bash
openclaw channels status
# Powinno wyświetlić: Google Chat default: enabled, configured, ...
```

### Inne problemy

- `openclaw channels status --probe` ujawnia błędy uwierzytelniania i brakującą konfigurację odbiorcy (wymagane są zarówno `audience`, jak i `audienceType`).
- Jeśli wiadomości nie docierają, sprawdź adres URL webhooka i konfigurację wyzwalaczy aplikacji Chat.
- Jeśli wymóg wzmianki blokuje odpowiedzi, ustaw `botUser` na nazwę zasobu użytkownika aplikacji i sprawdź `requireMention`.
- Uruchomienie `openclaw logs --follow` podczas wysyłania wiadomości testowej pokazuje, czy żądania docierają do Gateway.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i ograniczanie za pomocą wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i proces parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
