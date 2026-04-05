---
read_when:
    - Podczas pracy nad funkcjami kanału Google Chat
summary: Stan obsługi aplikacji Google Chat, możliwości i konfiguracja
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T13:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (Chat API)

Status: gotowe do DM + spaces przez webhooki Google Chat API (tylko HTTP).

## Szybka konfiguracja (dla początkujących)

1. Utwórz projekt Google Cloud i włącz **Google Chat API**.
   - Przejdź do: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Włącz API, jeśli nie jest jeszcze włączone.
2. Utwórz **Service Account**:
   - Kliknij **Create Credentials** > **Service Account**.
   - Nadaj mu dowolną nazwę (np. `openclaw-chat`).
   - Pozostaw uprawnienia puste (kliknij **Continue**).
   - Pozostaw listę podmiotów z dostępem pustą (kliknij **Done**).
3. Utwórz i pobierz **JSON Key**:
   - Na liście kont usługi kliknij to, które właśnie utworzono.
   - Przejdź do zakładki **Keys**.
   - Kliknij **Add Key** > **Create new key**.
   - Wybierz **JSON** i kliknij **Create**.
4. Zapisz pobrany plik JSON na hoście gateway (np. `~/.openclaw/googlechat-service-account.json`).
5. Utwórz aplikację Google Chat w [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Wypełnij sekcję **Application info**:
     - **App name**: (np. `OpenClaw`)
     - **Avatar URL**: (np. `https://openclaw.ai/logo.png`)
     - **Description**: (np. `Personal AI Assistant`)
   - Włącz **Interactive features**.
   - W sekcji **Functionality** zaznacz **Join spaces and group conversations**.
   - W sekcji **Connection settings** wybierz **HTTP endpoint URL**.
   - W sekcji **Triggers** wybierz **Use a common HTTP endpoint URL for all triggers** i ustaw adres na publiczny URL swojego gateway z dopisanym `/googlechat`.
     - _Wskazówka: uruchom `openclaw status`, aby znaleźć publiczny URL swojego gateway._
   - W sekcji **Visibility** zaznacz **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Wpisz swój adres e-mail (np. `user@example.com`) w polu tekstowym.
   - Kliknij **Save** na dole strony.
6. **Włącz status aplikacji**:
   - Po zapisaniu **odśwież stronę**.
   - Znajdź sekcję **App status** (zwykle u góry lub na dole po zapisaniu).
   - Zmień status na **Live - available to users**.
   - Kliknij ponownie **Save**.
7. Skonfiguruj OpenClaw, podając ścieżkę do konta usługi + odbiorcę webhooka:
   - Zmienna środowiskowa: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Lub konfiguracja: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Ustaw typ i wartość odbiorcy webhooka (`audience`) zgodnie z konfiguracją swojej aplikacji Chat.
9. Uruchom gateway. Google Chat będzie wysyłać żądania POST na ścieżkę webhooka.

## Dodawanie do Google Chat

Gdy gateway działa, a Twój adres e-mail został dodany do listy widoczności:

1. Przejdź do [Google Chat](https://chat.google.com/).
2. Kliknij ikonę **+** obok **Direct Messages**.
3. W pasku wyszukiwania (tam, gdzie zwykle dodajesz osoby) wpisz **App name** skonfigurowaną w Google Cloud Console.
   - **Uwaga**: bot _nie_ pojawi się na liście przeglądania „Marketplace”, ponieważ jest aplikacją prywatną. Musisz wyszukać go po nazwie.
4. Wybierz bota z wyników.
5. Kliknij **Add** lub **Chat**, aby rozpocząć rozmowę 1:1.
6. Wyślij „Hello”, aby wywołać asystenta!

## Publiczny URL (tylko webhook)

Webhooki Google Chat wymagają publicznego punktu końcowego HTTPS. Ze względów bezpieczeństwa **wystawiaj do internetu tylko ścieżkę `/googlechat`**. Zachowaj pulpit OpenClaw i inne wrażliwe punkty końcowe w sieci prywatnej.

### Opcja A: Tailscale Funnel (zalecane)

Użyj Tailscale Serve dla prywatnego pulpitu i Funnel dla publicznej ścieżki webhooka. Dzięki temu `/` pozostaje prywatne, a publicznie wystawione jest tylko `/googlechat`.

1. **Sprawdź, pod jakim adresem jest zbindowany gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Zanotuj adres IP (np. `127.0.0.1`, `0.0.0.0` albo adres Tailscale, taki jak `100.x.x.x`).

2. **Wystaw pulpit tylko dla tailnetu (port 8443):**

   ```bash
   # Jeśli zbindowano do localhost (127.0.0.1 lub 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Jeśli zbindowano tylko do adresu IP Tailscale (np. 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Wystaw publicznie tylko ścieżkę webhooka:**

   ```bash
   # Jeśli zbindowano do localhost (127.0.0.1 lub 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Jeśli zbindowano tylko do adresu IP Tailscale (np. 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoryzuj węzeł do dostępu Funnel:**
   Jeśli pojawi się monit, odwiedź URL autoryzacji pokazany w danych wyjściowych, aby włączyć Funnel dla tego węzła w polityce tailnetu.

5. **Zweryfikuj konfigurację:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Twój publiczny URL webhooka będzie mieć postać:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Twój prywatny pulpit pozostanie dostępny tylko w tailnecie:
`https://<node-name>.<tailnet>.ts.net:8443/`

Użyj publicznego URL (bez `:8443`) w konfiguracji aplikacji Google Chat.

> Uwaga: ta konfiguracja utrzymuje się po ponownym uruchomieniu. Aby usunąć ją później, uruchom `tailscale funnel reset` i `tailscale serve reset`.

### Opcja B: Reverse Proxy (Caddy)

Jeśli używasz reverse proxy, takiego jak Caddy, proxyuj tylko określoną ścieżkę:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Przy tej konfiguracji każde żądanie do `your-domain.com/` zostanie zignorowane albo zwróci 404, natomiast `your-domain.com/googlechat` zostanie bezpiecznie przekierowane do OpenClaw.

### Opcja C: Cloudflare Tunnel

Skonfiguruj reguły ingress tunelu tak, aby routowały tylko ścieżkę webhooka:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Jak to działa

1. Google Chat wysyła webhooki POST do gateway. Każde żądanie zawiera nagłówek `Authorization: Bearer <token>`.
   - OpenClaw weryfikuje uwierzytelnianie bearer przed odczytem/parsingiem pełnych treści webhooka, gdy nagłówek jest obecny.
   - Obsługiwane są żądania Google Workspace Add-on zawierające w treści `authorizationEventObject.systemIdToken`, z bardziej rygorystycznym limitem rozmiaru treści dla pre-autoryzacji.
2. OpenClaw weryfikuje token względem skonfigurowanych `audienceType` + `audience`:
   - `audienceType: "app-url"` → `audience` to URL Twojego webhooka HTTPS.
   - `audienceType: "project-number"` → `audience` to numer projektu Cloud.
3. Wiadomości są routowane według space:
   - DM używają klucza sesji `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces używają klucza sesji `agent:<agentId>:googlechat:group:<spaceId>`.
4. Dostęp do DM jest domyślnie realizowany przez pairing. Nieznani nadawcy otrzymują kod pairingu; zatwierdź go poleceniem:
   - `openclaw pairing approve googlechat <code>`
5. Group spaces domyślnie wymagają wzmianki @. Użyj `botUser`, jeśli wykrywanie wzmianki wymaga nazwy użytkownika aplikacji.

## Cele

Używaj tych identyfikatorów do dostarczania i list dozwolonych:

- Wiadomości bezpośrednie: `users/<userId>` (zalecane).
- Surowy adres e-mail `name@example.com` jest zmienny i jest używany tylko do bezpośredniego dopasowania listy dozwolonych, gdy `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Przestarzałe: `users/<email>` jest traktowane jako identyfikator użytkownika, a nie adres e-mail do listy dozwolonych.
- Spaces: `spaces/<spaceId>`.

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

- Poświadczenia konta usługi można także przekazać bezpośrednio przez `serviceAccount` (ciąg JSON).
- Obsługiwane jest również `serviceAccountRef` (env/file SecretRef), w tym odwołania dla poszczególnych kont pod `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Domyślna ścieżka webhooka to `/googlechat`, jeśli `webhookPath` nie jest ustawione.
- `dangerouslyAllowNameMatching` ponownie włącza dopasowanie zmiennych identyfikatorów e-mail dla list dozwolonych (tryb zgodności awaryjnej).
- Reakcje są dostępne przez narzędzie `reactions` i `channels action`, gdy `actions.reactions` jest włączone.
- Akcje wiadomości udostępniają `send` dla tekstu i `upload-file` dla jawnego wysyłania załączników. `upload-file` akceptuje `media` / `filePath` / `path` oraz opcjonalnie `message`, `filename` i kierowanie do wątku.
- `typingIndicator` obsługuje `none`, `message` (domyślnie) i `reaction` (reakcja wymaga OAuth użytkownika).
- Załączniki są pobierane przez Chat API i przechowywane w potoku mediów (rozmiar ograniczany przez `mediaMaxMb`).

Szczegóły dotyczące odwołań do sekretów: [Secrets Management](/gateway/secrets).

## Rozwiązywanie problemów

### 405 Method Not Allowed

Jeśli Google Cloud Logs Explorer pokazuje błędy takie jak:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Oznacza to, że program obsługi webhooka nie jest zarejestrowany. Typowe przyczyny:

1. **Kanał nie jest skonfigurowany**: w konfiguracji brakuje sekcji `channels.googlechat`. Zweryfikuj to poleceniem:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jeśli zwraca „Config path not found”, dodaj konfigurację (zobacz [Najważniejsze elementy konfiguracji](#najważniejsze-elementy-konfiguracji)).

2. **Plugin nie jest włączony**: sprawdź status pluginu:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jeśli widnieje jako „disabled”, dodaj do konfiguracji `plugins.entries.googlechat.enabled: true`.

3. **Gateway nie został ponownie uruchomiony**: po dodaniu konfiguracji uruchom ponownie gateway:

   ```bash
   openclaw gateway restart
   ```

Zweryfikuj, że kanał działa:

```bash
openclaw channels status
# Powinno pokazać: Google Chat default: enabled, configured, ...
```

### Inne problemy

- Sprawdź `openclaw channels status --probe`, aby wykryć błędy uwierzytelniania lub brak konfiguracji `audience`.
- Jeśli wiadomości nie docierają, potwierdź URL webhooka aplikacji Chat oraz subskrypcje zdarzeń.
- Jeśli bramkowanie wzmianką blokuje odpowiedzi, ustaw `botUser` na nazwę zasobu użytkownika aplikacji i sprawdź `requireMention`.
- Używaj `openclaw logs --follow` podczas wysyłania wiadomości testowej, aby zobaczyć, czy żądania docierają do gateway.

Powiązana dokumentacja:

- [Gateway configuration](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)

## Powiązane

- [Channels Overview](/channels) — wszystkie obsługiwane kanały
- [Pairing](/channels/pairing) — uwierzytelnianie DM i przepływ pairingu
- [Groups](/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianką
- [Channel Routing](/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
