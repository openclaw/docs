---
read_when:
    - Praca nad funkcjami kanału Google Chat
summary: Status obsługi aplikacji Google Chat, możliwości i konfiguracja
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Plugin do pobrania dla wiadomości prywatnych i przestrzeni przez Webhooki Google Chat API (tylko HTTP).

## Instalacja

Zainstaluj Google Chat przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Szybka konfiguracja (dla początkujących)

1. Utwórz projekt Google Cloud i włącz **Google Chat API**.
   - Przejdź do: [dane logowania Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Włącz API, jeśli nie jest jeszcze włączone.
2. Utwórz **konto usługi**:
   - Naciśnij **Create Credentials** > **Service Account**.
   - Nazwij je dowolnie (np. `openclaw-chat`).
   - Pozostaw uprawnienia puste (naciśnij **Continue**).
   - Pozostaw podmioty z dostępem puste (naciśnij **Done**).
3. Utwórz i pobierz **klucz JSON**:
   - Na liście kont usług kliknij właśnie utworzone konto.
   - Przejdź do karty **Keys**.
   - Kliknij **Add Key** > **Create new key**.
   - Wybierz **JSON** i naciśnij **Create**.
4. Zapisz pobrany plik JSON na hoście Gateway (np. `~/.openclaw/googlechat-service-account.json`).
5. Utwórz aplikację Google Chat w [konfiguracji Chat w Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Wypełnij **informacje o aplikacji**:
     - **Nazwa aplikacji**: (np. `OpenClaw`)
     - **Adres URL awatara**: (np. `https://openclaw.ai/logo.png`)
     - **Opis**: (np. `Personal AI Assistant`)
   - Włącz **funkcje interaktywne**.
   - W sekcji **Funkcjonalność** zaznacz **Dołączanie do przestrzeni i rozmów grupowych**.
   - W sekcji **Ustawienia połączenia** wybierz **Adres URL punktu końcowego HTTP**.
   - W sekcji **Wyzwalacze** wybierz **Użyj wspólnego adresu URL punktu końcowego HTTP dla wszystkich wyzwalaczy** i ustaw go na publiczny adres URL swojego Gateway z dodanym `/googlechat`.
     - _Wskazówka: uruchom `openclaw status`, aby znaleźć publiczny adres URL swojego Gateway._
   - W sekcji **Widoczność** zaznacz **Udostępnij tę aplikację Chat określonym osobom i grupom w `<Your Domain>`**.
   - Wpisz swój adres e-mail (np. `user@example.com`) w polu tekstowym.
   - Kliknij **Save** na dole.
6. **Włącz status aplikacji**:
   - Po zapisaniu **odśwież stronę**.
   - Znajdź sekcję **Status aplikacji** (zwykle u góry lub u dołu po zapisaniu).
   - Zmień status na **Live - dostępna dla użytkowników**.
   - Kliknij ponownie **Save**.
7. Skonfiguruj OpenClaw ze ścieżką do konta usługi i odbiorcą Webhooka:
   - Zmienna środowiskowa: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Albo konfiguracja: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Ustaw typ i wartość odbiorcy Webhooka (zgodne z konfiguracją aplikacji Chat).
9. Uruchom Gateway. Google Chat będzie wysyłać żądania POST do ścieżki Webhooka.

## Dodawanie do Google Chat

Gdy Gateway działa, a Twój e-mail jest dodany do listy widoczności:

1. Przejdź do [Google Chat](https://chat.google.com/).
2. Kliknij ikonę **+** (plus) obok **Wiadomości prywatne**.
3. W pasku wyszukiwania (tam, gdzie zwykle dodajesz osoby) wpisz **nazwę aplikacji** skonfigurowaną w Google Cloud Console.
   - **Uwaga**: bot _nie_ pojawi się na liście przeglądania „Marketplace”, ponieważ jest aplikacją prywatną. Musisz wyszukać go po nazwie.
4. Wybierz bota z wyników.
5. Kliknij **Dodaj** lub **Czat**, aby rozpocząć rozmowę 1:1.
6. Wyślij „Hello”, aby wyzwolić asystenta!

## Publiczny adres URL (tylko Webhook)

Webhooki Google Chat wymagają publicznego punktu końcowego HTTPS. Ze względów bezpieczeństwa **wystawiaj do internetu tylko ścieżkę `/googlechat`**. Panel OpenClaw i inne wrażliwe punkty końcowe pozostaw w sieci prywatnej.

### Opcja A: Tailscale Funnel (zalecane)

Użyj Tailscale Serve dla prywatnego panelu i Funnel dla publicznej ścieżki Webhooka. Dzięki temu `/` pozostaje prywatne, a publicznie wystawione jest tylko `/googlechat`.

1. **Sprawdź, z jakim adresem jest powiązany Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Zanotuj adres IP (np. `127.0.0.1`, `0.0.0.0` albo swój adres IP Tailscale, taki jak `100.x.x.x`).

2. **Wystaw panel tylko do tailnetu (port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Wystaw publicznie tylko ścieżkę Webhooka:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoryzuj węzeł do dostępu Funnel:**
   Jeśli pojawi się monit, odwiedź adres URL autoryzacji pokazany w danych wyjściowych, aby włączyć Funnel dla tego węzła w polityce tailnetu.

5. **Zweryfikuj konfigurację:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Publiczny adres URL Webhooka będzie taki:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Prywatny panel pozostanie dostępny tylko w tailnecie:
`https://<node-name>.<tailnet>.ts.net:8443/`

Użyj publicznego adresu URL (bez `:8443`) w konfiguracji aplikacji Google Chat.

> Uwaga: ta konfiguracja jest zachowywana po ponownym uruchomieniu. Aby usunąć ją później, uruchom `tailscale funnel reset` i `tailscale serve reset`.

### Opcja B: odwrotne proxy (Caddy)

Jeśli używasz odwrotnego proxy, takiego jak Caddy, przekazuj tylko konkretną ścieżkę:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Przy tej konfiguracji każde żądanie do `your-domain.com/` zostanie zignorowane albo zwrócone jako 404, a `your-domain.com/googlechat` będzie bezpiecznie kierowane do OpenClaw.

### Opcja C: Cloudflare Tunnel

Skonfiguruj reguły ruchu przychodzącego tunelu tak, aby kierowały tylko ścieżkę Webhooka:

- **Ścieżka**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Reguła domyślna**: HTTP 404 (Not Found)

## Jak to działa

1. Google Chat wysyła żądania POST Webhooka do Gateway. Każde żądanie zawiera nagłówek `Authorization: Bearer <token>`.
   - OpenClaw weryfikuje autoryzację bearer przed odczytaniem/przetworzeniem pełnych treści Webhooka, gdy nagłówek jest obecny.
   - Żądania dodatków Google Workspace, które zawierają w treści `authorizationEventObject.systemIdToken`, są obsługiwane z użyciem bardziej rygorystycznego budżetu treści przed autoryzacją.
2. OpenClaw weryfikuje token względem skonfigurowanych `audienceType` + `audience`:
   - `audienceType: "app-url"` → odbiorcą jest Twój adres URL Webhooka HTTPS.
   - `audienceType: "project-number"` → odbiorcą jest numer projektu Cloud.
3. Wiadomości są kierowane według przestrzeni:
   - Wiadomości prywatne używają klucza sesji `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Przestrzenie używają klucza sesji `agent:<agentId>:googlechat:group:<spaceId>`.
4. Dostęp przez wiadomości prywatne domyślnie używa parowania. Nieznani nadawcy otrzymują kod parowania; zatwierdź go poleceniem:
   - `openclaw pairing approve googlechat <code>`
5. Przestrzenie grupowe domyślnie wymagają wzmianki @. Użyj `botUser`, jeśli wykrywanie wzmianek wymaga nazwy użytkownika aplikacji.

## Cele

Używaj tych identyfikatorów do dostarczania i list dozwolonych:

- Wiadomości prywatne: `users/<userId>` (zalecane).
- Surowy e-mail `name@example.com` jest zmienny i używany tylko do dopasowywania bezpośredniej listy dozwolonych, gdy `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Przestarzałe: `users/<email>` jest traktowane jako identyfikator użytkownika, a nie lista dozwolonych adresów e-mail.
- Przestrzenie: `spaces/<spaceId>`.

## Najważniejsze elementy konfiguracji

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Uwagi:

- Dane logowania konta usługi można też przekazać wprost przez `serviceAccount` (ciąg JSON).
- Obsługiwany jest też `serviceAccountRef` (env/file SecretRef), w tym referencje dla poszczególnych kont pod `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Domyślna ścieżka Webhooka to `/googlechat`, jeśli `webhookPath` nie jest ustawione.
- `dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych podmiotów e-mail dla list dozwolonych (tryb zgodności awaryjnej).
- Reakcje są dostępne przez narzędzie `reactions` i `channels action`, gdy włączone jest `actions.reactions`.
- Akcje wiadomości udostępniają `send` dla tekstu i `upload-file` dla jawnego wysyłania załączników. `upload-file` przyjmuje `media` / `filePath` / `path` oraz opcjonalnie `message`, `filename` i wskazanie wątku docelowego.
- `typingIndicator` obsługuje `none`, `message` (domyślnie) i `reaction` (reakcja wymaga OAuth użytkownika).
- Załączniki są pobierane przez Chat API i zapisywane w potoku mediów (rozmiar ograniczony przez `mediaMaxMb`).

Szczegóły referencji sekretów: [zarządzanie sekretami](/pl/gateway/secrets).

## Rozwiązywanie problemów

### 405 Method Not Allowed

Jeśli Google Cloud Logs Explorer pokazuje błędy takie jak:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Oznacza to, że handler Webhooka nie jest zarejestrowany. Typowe przyczyny:

1. **Kanał nie jest skonfigurowany**: w konfiguracji brakuje sekcji `channels.googlechat`. Zweryfikuj to poleceniem:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jeśli zwraca „Config path not found”, dodaj konfigurację (zobacz [najważniejsze elementy konfiguracji](#config-highlights)).

2. **Plugin nie jest włączony**: sprawdź status Pluginu:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jeśli pokazuje „disabled”, dodaj `plugins.entries.googlechat.enabled: true` do konfiguracji.

3. **Gateway nie został ponownie uruchomiony**: po dodaniu konfiguracji uruchom ponownie Gateway:

   ```bash
   openclaw gateway restart
   ```

Zweryfikuj, że kanał działa:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Inne problemy

- Sprawdź `openclaw channels status --probe` pod kątem błędów autoryzacji albo brakującej konfiguracji odbiorcy.
- Jeśli wiadomości nie przychodzą, potwierdź adres URL Webhooka aplikacji Chat i subskrypcje zdarzeń.
- Jeśli bramkowanie wzmianek blokuje odpowiedzi, ustaw `botUser` na nazwę zasobu użytkownika aplikacji i zweryfikuj `requireMention`.
- Użyj `openclaw logs --follow` podczas wysyłania wiadomości testowej, aby sprawdzić, czy żądania docierają do Gateway.

Powiązana dokumentacja:

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Bezpieczeństwo](/pl/gateway/security)
- [Reakcje](/pl/tools/reactions)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
