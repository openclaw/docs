---
read_when:
    - Praca nad funkcjami kanału Google Chat
summary: Status obsługi aplikacji Google Chat, możliwości i konfiguracja
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T09:42:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Plugin do pobrania dla DM-ów i przestrzeni za pośrednictwem webhooków Google Chat API (tylko HTTP).

## Instalacja

Zainstaluj Google Chat przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Szybka konfiguracja (początkujący)

1. Utwórz projekt Google Cloud i włącz **Google Chat API**.
   - Przejdź do: [Poświadczenia Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Włącz API, jeśli nie jest jeszcze włączone.
2. Utwórz **konto usługi**:
   - Naciśnij **Utwórz poświadczenia** > **Konto usługi**.
   - Nadaj mu dowolną nazwę (np. `openclaw-chat`).
   - Pozostaw uprawnienia puste (naciśnij **Kontynuuj**).
   - Pozostaw użytkowników z dostępem puste (naciśnij **Gotowe**).
3. Utwórz i pobierz **klucz JSON**:
   - Na liście kont usług kliknij to, które właśnie utworzono.
   - Przejdź do karty **Klucze**.
   - Kliknij **Dodaj klucz** > **Utwórz nowy klucz**.
   - Wybierz **JSON** i naciśnij **Utwórz**.
4. Zapisz pobrany plik JSON na hoście Gateway (np. `~/.openclaw/googlechat-service-account.json`).
5. Utwórz aplikację Google Chat w [konfiguracji Chat w Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Wypełnij **Informacje o aplikacji**:
     - **Nazwa aplikacji**: (np. `OpenClaw`)
     - **URL awatara**: (np. `https://openclaw.ai/logo.png`)
     - **Opis**: (np. `Personal AI Assistant`)
   - Włącz **funkcje interaktywne**.
   - W sekcji **Funkcjonalność** zaznacz **Dołączanie do przestrzeni i rozmów grupowych**.
   - W sekcji **Ustawienia połączenia** wybierz **URL punktu końcowego HTTP**.
   - W sekcji **Wyzwalacze** wybierz **Użyj wspólnego adresu URL punktu końcowego HTTP dla wszystkich wyzwalaczy** i ustaw go na publiczny URL Gateway z dodanym `/googlechat`.
     - _Wskazówka: uruchom `openclaw status`, aby znaleźć publiczny URL Gateway._
   - W sekcji **Widoczność** zaznacz **Udostępnij tę aplikację Chat określonym osobom i grupom w `<Your Domain>`**.
   - Wpisz swój adres e-mail (np. `user@example.com`) w polu tekstowym.
   - Kliknij **Zapisz** na dole.
6. **Włącz status aplikacji**:
   - Po zapisaniu **odśwież stronę**.
   - Znajdź sekcję **Status aplikacji** (zwykle u góry lub u dołu po zapisaniu).
   - Zmień status na **Live - available to users**.
   - Kliknij ponownie **Zapisz**.
7. Skonfiguruj OpenClaw ze ścieżką konta usługi i odbiorcą webhooka:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Albo konfiguracja: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Ustaw typ i wartość odbiorcy webhooka (zgodnie z konfiguracją aplikacji Chat).
9. Uruchom Gateway. Google Chat będzie wysyłać żądania POST do ścieżki webhooka.

## Dodawanie do Google Chat

Gdy Gateway działa, a Twój adres e-mail został dodany do listy widoczności:

1. Przejdź do [Google Chat](https://chat.google.com/).
2. Kliknij ikonę **+** (plus) obok **Wiadomości bezpośrednie**.
3. W pasku wyszukiwania (tam, gdzie zwykle dodajesz osoby) wpisz **nazwę aplikacji** skonfigurowaną w Google Cloud Console.
   - **Uwaga**: bot _nie_ pojawi się na liście przeglądania „Marketplace”, ponieważ jest aplikacją prywatną. Musisz wyszukać go po nazwie.
4. Wybierz bota z wyników.
5. Kliknij **Dodaj** lub **Czat**, aby rozpocząć rozmowę 1:1.
6. Wyślij „Hello”, aby uruchomić asystenta!

## Publiczny URL (tylko Webhook)

Webhooki Google Chat wymagają publicznego punktu końcowego HTTPS. Ze względów bezpieczeństwa **wystawiaj do internetu tylko ścieżkę `/googlechat`**. Panel OpenClaw i inne wrażliwe punkty końcowe trzymaj w sieci prywatnej.

### Opcja A: Tailscale Funnel (zalecane)

Użyj Tailscale Serve dla prywatnego panelu i Funnel dla publicznej ścieżki webhooka. Dzięki temu `/` pozostaje prywatne, a wystawione publicznie jest tylko `/googlechat`.

1. **Sprawdź, do jakiego adresu jest przypisany Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Zanotuj adres IP (np. `127.0.0.1`, `0.0.0.0` albo Twój adres IP Tailscale, taki jak `100.x.x.x`).

2. **Wystaw panel tylko w tailnecie (port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Wystaw publicznie tylko ścieżkę webhooka:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoryzuj Node do dostępu Funnel:**
   Jeśli pojawi się monit, odwiedź URL autoryzacji pokazany w wyjściu, aby włączyć Funnel dla tego Node w polityce tailnetu.

5. **Zweryfikuj konfigurację:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Publiczny URL webhooka będzie wyglądać tak:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Prywatny panel pozostaje dostępny tylko w tailnecie:
`https://<node-name>.<tailnet>.ts.net:8443/`

Użyj publicznego URL-a (bez `:8443`) w konfiguracji aplikacji Google Chat.

> Uwaga: ta konfiguracja utrzymuje się po ponownym uruchomieniu. Aby usunąć ją później, uruchom `tailscale funnel reset` i `tailscale serve reset`.

### Opcja B: Reverse Proxy (Caddy)

Jeśli używasz reverse proxy takiego jak Caddy, proxyuj tylko konkretną ścieżkę:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Przy tej konfiguracji każde żądanie do `your-domain.com/` zostanie zignorowane lub zwróci 404, a `your-domain.com/googlechat` zostanie bezpiecznie przekierowane do OpenClaw.

### Opcja C: Cloudflare Tunnel

Skonfiguruj reguły ingress tunelu tak, aby kierowały tylko ścieżkę webhooka:

- **Ścieżka**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Reguła domyślna**: HTTP 404 (Nie znaleziono)

## Jak to działa

1. Google Chat wysyła webhookowe żądania POST do Gateway. Każde żądanie zawiera nagłówek `Authorization: Bearer <token>`.
   - OpenClaw weryfikuje uwierzytelnianie bearer przed odczytem i parsowaniem pełnych treści webhooka, gdy nagłówek jest obecny.
   - Żądania Google Workspace Add-on, które przenoszą `authorizationEventObject.systemIdToken` w treści, są obsługiwane z użyciem bardziej rygorystycznego budżetu treści przed uwierzytelnieniem.
2. OpenClaw weryfikuje token względem skonfigurowanych `audienceType` i `audience`:
   - `audienceType: "app-url"` → odbiorcą jest URL webhooka HTTPS.
   - `audienceType: "project-number"` → odbiorcą jest numer projektu Cloud.
3. Wiadomości są routowane według przestrzeni:
   - DM-y używają klucza sesji `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Przestrzenie używają klucza sesji `agent:<agentId>:googlechat:group:<spaceId>`.
4. Dostęp do DM-ów domyślnie odbywa się przez parowanie. Nieznani nadawcy otrzymują kod parowania; zatwierdź go poleceniem:
   - `openclaw pairing approve googlechat <code>`
5. Przestrzenie grupowe domyślnie wymagają wzmianki @. Użyj `botUser`, jeśli wykrywanie wzmianek wymaga nazwy użytkownika aplikacji.

## Cele

Używaj tych identyfikatorów do dostarczania i list dozwolonych:

- Wiadomości bezpośrednie: `users/<userId>` (zalecane).
- Surowy adres e-mail `name@example.com` jest zmienny i używany tylko do bezpośredniego dopasowywania list dozwolonych, gdy `channels.googlechat.dangerouslyAllowNameMatching: true`.
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
          allow: true,
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

- Poświadczenia konta usługi można też przekazać bezpośrednio przez `serviceAccount` (ciąg JSON).
- Obsługiwane jest też `serviceAccountRef` (env/file SecretRef), w tym referencje dla poszczególnych kont pod `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Domyślna ścieżka webhooka to `/googlechat`, jeśli `webhookPath` nie jest ustawione.
- `dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych podmiotów e-mail dla list dozwolonych (tryb zgodności awaryjnej).
- Reakcje są dostępne przez narzędzie `reactions` i `channels action`, gdy `actions.reactions` jest włączone.
- Akcje wiadomości udostępniają `send` dla tekstu oraz `upload-file` dla jawnego wysyłania załączników. `upload-file` akceptuje `media` / `filePath` / `path` oraz opcjonalne `message`, `filename` i wskazywanie wątku docelowego.
- `typingIndicator` obsługuje `none`, `message` (domyślnie) i `reaction` (reakcja wymaga OAuth użytkownika).
- Załączniki są pobierane przez Chat API i przechowywane w potoku multimediów (rozmiar ograniczony przez `mediaMaxMb`).

Szczegóły referencji sekretów: [Zarządzanie sekretami](/pl/gateway/secrets).

## Rozwiązywanie problemów

### 405 Method Not Allowed

Jeśli Google Cloud Logs Explorer pokazuje błędy takie jak:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Oznacza to, że handler webhooka nie jest zarejestrowany. Typowe przyczyny:

1. **Kanał nie jest skonfigurowany**: w konfiguracji brakuje sekcji `channels.googlechat`. Zweryfikuj poleceniem:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jeśli zwraca „Config path not found”, dodaj konfigurację (zobacz [Najważniejsze elementy konfiguracji](#config-highlights)).

2. **Plugin nie jest włączony**: sprawdź status Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jeśli pokazuje „disabled”, dodaj `plugins.entries.googlechat.enabled: true` do konfiguracji.

3. **Gateway nie został ponownie uruchomiony**: po dodaniu konfiguracji uruchom ponownie Gateway:

   ```bash
   openclaw gateway restart
   ```

Zweryfikuj, czy kanał działa:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Inne problemy

- Sprawdź `openclaw channels status --probe` pod kątem błędów uwierzytelniania lub brakującej konfiguracji odbiorcy.
- Jeśli wiadomości nie przychodzą, potwierdź URL webhooka aplikacji Chat i subskrypcje zdarzeń.
- Jeśli bramkowanie wzmiankami blokuje odpowiedzi, ustaw `botUser` na nazwę zasobu użytkownika aplikacji i zweryfikuj `requireMention`.
- Użyj `openclaw logs --follow` podczas wysyłania wiadomości testowej, aby sprawdzić, czy żądania docierają do Gateway.

Powiązane dokumenty:

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Bezpieczeństwo](/pl/gateway/security)
- [Reakcje](/pl/tools/reactions)

## Powiązane

- [Omówienie kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM-ów i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
