---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Stan obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

Status: obsługiwane są tekst i załączniki DM; wysyłanie plików w kanałach/grupach wymaga `sharePointSiteId` + uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane przez Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek zaczynających się od pliku.

## Wbudowany Plugin

Microsoft Teams jest dostarczany jako wbudowany Plugin w obecnych wydaniach OpenClaw, więc w normalnej spakowanej kompilacji nie jest wymagana
osobna instalacja.

Jeśli używasz starszej kompilacji albo instalacji niestandardowej, która wyklucza wbudowany Teams,
zainstaluj pakiet npm bezpośrednio:

```bash
openclaw plugins install @openclaw/msteams
```

Użyj samej nazwy pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) obsługuje rejestrację bota, tworzenie manifestu i generowanie poświadczeń w jednym poleceniu.

**1. Zainstaluj i zaloguj się**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI jest obecnie w wersji preview. Polecenia i flagi mogą zmieniać się między wydaniami.
</Note>

**2. Uruchom tunel** (Teams nie może połączyć się z localhost)

Zainstaluj i uwierzytelnij devtunnel CLI, jeśli jeszcze tego nie zrobiono ([przewodnik wprowadzający](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` jest wymagane, ponieważ Teams nie może uwierzytelniać się z devtunnels. Każde przychodzące żądanie bota nadal jest automatycznie weryfikowane przez Teams SDK.
</Note>

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (ale mogą one zmieniać adresy URL w każdej sesji).

**3. Utwórz aplikację**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

To pojedyncze polecenie:

- Tworzy aplikację Entra ID (Azure AD)
- Generuje sekret klienta
- Buduje i przesyła manifest aplikacji Teams (z ikonami)
- Rejestruje bota (domyślnie zarządzany przez Teams - subskrypcja Azure nie jest potrzebna)

Wynik pokaże `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` oraz **Teams App ID** - zanotuj je do kolejnych kroków. Oferuje też bezpośrednią instalację aplikacji w Teams.

**4. Skonfiguruj OpenClaw**, używając poświadczeń z wyniku:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Albo użyj bezpośrednio zmiennych środowiskowych: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Zainstaluj aplikację w Teams**

`teams app create` poprosi o instalację aplikacji - wybierz „Install in Teams”. Jeśli ten krok został pominięty, możesz później uzyskać link:

```bash
teams app get <teamsAppId> --install-link
```

**6. Sprawdź, czy wszystko działa**

```bash
teams app doctor <teamsAppId>
```

Uruchamia diagnostykę rejestracji bota, konfiguracji aplikacji AAD, poprawności manifestu i konfiguracji SSO.

W przypadku wdrożeń produkcyjnych rozważ użycie [uwierzytelniania federacyjnego](/pl/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certyfikat lub tożsamość zarządzana) zamiast sekretów klienta.

<Note>
Czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` albo użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (z bramkowaniem przez wzmiankę).
</Note>

## Cele

- Rozmawiaj z OpenClaw przez DM w Teams, czaty grupowe lub kanały.
- Zachowaj deterministyczne trasowanie: odpowiedzi zawsze wracają do kanału, z którego przyszły.
- Domyślnie używaj bezpiecznego zachowania kanału (wzmianki wymagane, chyba że skonfigurowano inaczej).

## Zapisy konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wywoływane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (DM + grupy)

**Dostęp DM**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do czasu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- Nie polegaj na dopasowywaniu UPN/nazwy wyświetlanej w allowlistach - mogą się zmieniać. OpenClaw domyślnie wyłącza bezpośrednie dopasowywanie nazw; włącz je jawnie przez `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy na identyfikatory przez Microsoft Graph, gdy pozwalają na to poświadczenia.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (blokowane, chyba że dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby zastąpić wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy mogą wyzwalać działanie w czatach grupowych/kanałach (wraca do `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (nadal domyślnie bramkowane przez wzmiankę).
- Aby nie zezwolić na **żadne kanały**, ustaw `channels.msteams.groupPolicy: "disabled"`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlista kanałów**

- Ogranicz zakres odpowiedzi grup/kanałów, wymieniając zespoły i kanały w `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów konwersacji Teams z linków Teams, a nie zmiennych nazw wyświetlanych.
- Gdy `groupPolicy="allowlist"` i istnieje allowlista zespołów, akceptowane są tylko wymienione zespoły/kanały (z bramkowaniem przez wzmiankę).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Przy starcie OpenClaw rozwiązuje nazwy zespołów/kanałów i użytkowników z allowlisty na identyfikatory (gdy pozwalają na to uprawnienia Graph)
  i loguje mapowanie; nierozwiązane nazwy zespołów/kanałów są zachowywane tak, jak wpisano, ale domyślnie ignorowane przy trasowaniu, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>Konfiguracja ręczna (bez Teams CLI)</strong></summary>

Jeśli nie możesz użyć Teams CLI, możesz ręcznie skonfigurować bota przez Azure Portal.

### Jak to działa

1. Upewnij się, że Plugin Microsoft Teams jest dostępny (wbudowany w obecnych wydaniach).
2. Utwórz **Azure Bot** (App ID + sekret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (albo w zakresie osobistym dla DM).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (albo zmiennych środowiskowych) i uruchom Gateway.
6. Gateway domyślnie nasłuchuje ruchu Webhook Bot Framework na `/api/messages`.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                  |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
   | **Subscription**   | Wybierz swoją subskrypcję Azure                          |
   | **Resource group** | Utwórz nową albo użyj istniejącej                        |
   | **Pricing tier**   | **Free** do developmentu/testowania                      |
   | **Type of App**    | **Single Tenant** (zalecane - zobacz uwagę poniżej)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Tworzenie nowych botów wielodzierżawnych zostało wycofane po 2025-07-31. Używaj **Single Tenant** dla nowych botów.
</Warning>

3. Kliknij **Review + create** → **Create** (poczekaj około 1-2 minuty)

### Krok 2: Pobierz poświadczenia

1. Przejdź do zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to jest Twój `appId`
3. Kliknij **Manage Password** → przejdź do App Registration
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to jest Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to jest Twój `tenantId`

### Krok 3: Skonfiguruj punkt końcowy wiadomości

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na URL Webhook:
   - Produkcja: `https://your-domain.com/api/messages`
   - Lokalny development: użyj tunelu (zobacz [Lokalny development](#local-development-tunneling) poniżej)

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj warunki świadczenia usług

### Krok 5: Zbuduj manifest aplikacji Teams

- Dołącz wpis `bot` z `botId = <App ID>`.
- Zakresy: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (wymagane do obsługi plików w zakresie osobistym).
- Dodaj uprawnienia RSC (zobacz [Uprawnienia RSC](#current-teams-rsc-permissions-manifest)).
- Utwórz ikony: `outline.png` (32x32) i `color.png` (192x192).
- Spakuj wszystkie trzy pliki razem: `manifest.json`, `outline.png`, `color.png`.

### Krok 6: Skonfiguruj OpenClaw

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Zmienne środowiskowe: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Krok 7: Uruchom Gateway

Kanał Teams uruchamia się automatycznie, gdy Plugin jest dostępny i istnieje konfiguracja `msteams` z poświadczeniami.

</details>

## Uwierzytelnianie federacyjne (certyfikat plus tożsamość zarządzana)

> Dodano w 2026.4.11

W przypadku wdrożeń produkcyjnych OpenClaw obsługuje **uwierzytelnianie federacyjne** jako bezpieczniejszą alternatywę dla sekretów klienta. Dostępne są dwie metody:

### Opcja A: Uwierzytelnianie oparte na certyfikacie

Użyj certyfikatu PEM zarejestrowanego w rejestracji aplikacji Entra ID.

**Konfiguracja:**

1. Wygeneruj lub uzyskaj certyfikat (format PEM z kluczem prywatnym).
2. W Entra ID → App Registration → **Certificates & secrets** → **Certificates** → prześlij certyfikat publiczny.

**Konfiguracja:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opcja B: Azure Managed Identity

Użyj Azure Managed Identity do uwierzytelniania bez hasła. To idealne rozwiązanie dla wdrożeń w infrastrukturze Azure (AKS, App Service, maszyny wirtualne Azure), gdzie dostępna jest tożsamość zarządzana.

**Jak to działa:**

1. Pod/VM bota ma tożsamość zarządzaną (przypisaną przez system albo przypisaną przez użytkownika).
2. **Poświadczenie tożsamości federacyjnej** łączy tożsamość zarządzaną z rejestracją aplikacji Entra ID.
3. W czasie działania OpenClaw używa `@azure/identity` do pozyskiwania tokenów z punktu końcowego Azure IMDS (`169.254.169.254`).
4. Token jest przekazywany do Teams SDK w celu uwierzytelnienia bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączoną tożsamością zarządzaną (AKS workload identity, App Service, VM)
- Poświadczenie tożsamości federacyjnej utworzone w rejestracji aplikacji Entra ID
- Dostęp sieciowy do IMDS (`169.254.169.254:80`) z poda/VM

**Konfiguracja (tożsamość zarządzana przypisana przez system):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Konfiguracja (przypisana przez użytkownika tożsamość zarządzana):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (tylko dla przypisanej przez użytkownika)

### Konfiguracja AKS Workload Identity

Dla wdrożeń AKS używających Workload Identity:

1. **Włącz Workload Identity** w swoim klastrze AKS.
2. **Utwórz poświadczenie tożsamości federacyjnej** w rejestracji aplikacji Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Dodaj adnotację do konta usługi Kubernetes** z identyfikatorem klienta aplikacji:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Dodaj etykietę do poda** na potrzeby wstrzyknięcia Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zapewnij dostęp sieciowy** do IMDS (`169.254.169.254`) - jeśli używasz NetworkPolicy, dodaj regułę ruchu wychodzącego zezwalającą na ruch do `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Metoda                 | Konfiguracja                                  | Zalety                                  | Wady                                             |
| ---------------------- | -------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| **Sekret klienta**     | `appPassword`                                | Prosta konfiguracja                     | Wymagana rotacja sekretu, mniejsze bezpieczeństwo |
| **Certyfikat**         | `authType: "federated"` + `certificatePath`  | Brak współdzielonego sekretu w sieci    | Narzut związany z zarządzaniem certyfikatami     |
| **Managed Identity**   | `authType: "federated"` + `useManagedIdentity` | Bez hasła, brak sekretów do zarządzania | Wymagana infrastruktura Azure                    |

**Domyślne zachowanie:** Gdy `authType` nie jest ustawione, OpenClaw domyślnie używa uwierzytelniania sekretem klienta. Istniejące konfiguracje nadal działają bez zmian.

## Programowanie lokalne (tunelowanie)

Teams nie może połączyć się z `localhost`. Użyj trwałego tunelu deweloperskiego, aby Twój URL pozostawał taki sam między sesjami:

```bash
# Jednorazowa konfiguracja:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Każda sesja deweloperska:
devtunnel host my-openclaw-bot
```

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (URL-e mogą zmieniać się w każdej sesji).

Jeśli URL tunelu się zmieni, zaktualizuj punkt końcowy:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Testowanie bota

**Uruchom diagnostykę:**

```bash
teams app doctor <teamsAppId>
```

Sprawdza rejestrację bota, aplikację AAD, manifest i konfigurację SSO w jednym przebiegu.

**Wyślij wiadomość testową:**

1. Zainstaluj aplikację Teams (użyj linku instalacyjnego z `teams app get <id> --install-link`)
2. Znajdź bota w Teams i wyślij DM
3. Sprawdź logi Gateway pod kątem przychodzącej aktywności

## Zmienne środowiskowe

Wszystkie klucze konfiguracji można zamiast tego ustawić za pomocą zmiennych środowiskowych:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opcjonalnie: `"secret"` lub `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federacyjne + certyfikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcjonalnie, niewymagane do uwierzytelniania)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federacyjne + tożsamość zarządzana)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (tylko MI przypisana przez użytkownika)

## Akcja informacji o członku

OpenClaw udostępnia akcję `member-info` opartą na Graph dla Microsoft Teams, aby agenci i automatyzacje mogły pobierać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola) bezpośrednio z Microsoft Graph.

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` ze zgodą administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` kontroluje, ile ostatnich wiadomości kanału/grupy jest dołączanych do promptu.
- Używa wartości zapasowej `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobrana historia wątku jest filtrowana według list dozwolonych nadawców (`allowFrom` / `groupAllowFrom`), więc inicjowanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Kontekst cytowanego załącznika (`ReplyTo*` wyprowadzony z HTML odpowiedzi Teams) jest obecnie przekazywany w otrzymanej postaci.
- Innymi słowy, listy dozwolonych nadawców kontrolują, kto może wyzwolić agenta; obecnie filtrowane są tylko konkretne ścieżki kontekstu uzupełniającego.
- Historię DM można ograniczyć za pomocą `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania dla poszczególnych użytkowników: `channels.msteams.dms["<user_id>"].historyLimit`.

## Bieżące uprawnienia RSC Teams (manifest)

To są **istniejące uprawnienia resourceSpecific** w naszym manifeście aplikacji Teams. Obowiązują tylko w zespole/czacie, w którym aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) - odbieranie wszystkich wiadomości kanału bez @wzmianki
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) - odbieranie wszystkich wiadomości czatu grupowego bez @wzmianki

Aby dodać uprawnienia RSC przez Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Przykładowy manifest Teams (zredagowany)

Minimalny, prawidłowy przykład z wymaganymi polami. Zastąp identyfikatory i URL-e.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Zastrzeżenia dotyczące manifestu (pola wymagane)

- `bots[].botId` **musi** odpowiadać Azure Bot App ID.
- `webApplicationInfo.id` **musi** odpowiadać Azure Bot App ID.
- `bots[].scopes` musi zawierać powierzchnie, których planujesz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać odczyt/wysyłanie kanału, jeśli chcesz obsługiwać ruch kanału.

### Aktualizowanie istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. dodać uprawnienia RSC):

```bash
# Pobierz, edytuj i ponownie prześlij manifest
teams app manifest download <teamsAppId> manifest.json
# Edytuj manifest.json lokalnie...
teams app manifest upload manifest.json <teamsAppId>
# Wersja jest automatycznie zwiększana, jeśli treść się zmieniła
```

Po aktualizacji zainstaluj ponownie aplikację w każdym zespole, aby nowe uprawnienia zaczęły obowiązywać, oraz **całkowicie zamknij i uruchom ponownie Teams** (nie tylko zamknij okno), aby wyczyścić buforowane metadane aplikacji.

<details>
<summary>Ręczna aktualizacja manifestu (bez CLI)</summary>

1. Zaktualizuj swój `manifest.json` nowymi ustawieniami
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Spakuj ponownie** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik zip:
   - **Teams Admin Center:** Aplikacje Teams → Zarządzaj aplikacjami → znajdź swoją aplikację → Prześlij nową wersję
   - **Sideload:** W Teams → Aplikacje → Zarządzaj swoimi aplikacjami → Prześlij aplikację niestandardową

</details>

## Możliwości: tylko RSC vs Graph

### Z **samym Teams RSC** (aplikacja zainstalowana, brak uprawnień Graph API)

Działa:

- Odczyt **tekstowej** treści wiadomości kanału.
- Wysyłanie **tekstowej** treści wiadomości kanału.
- Odbieranie załączników plików w **osobistych (DM)** wiadomościach.

Nie działa:

- **Obrazy lub zawartość plików** kanału/grupy (ładunek zawiera tylko namiastkę HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości (poza zdarzeniem Webhook na żywo).

### Z **Teams RSC + uprawnieniami aplikacyjnymi Microsoft Graph**

Dodaje:

- Pobieranie hostowanych treści (obrazów wklejonych do wiadomości).
- Pobieranie załączników plików przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości kanału/czatu przez Graph.

### RSC vs Graph API

| Możliwość                  | Uprawnienia RSC          | Graph API                                  |
| -------------------------- | ------------------------ | ------------------------------------------ |
| **Wiadomości w czasie rzeczywistym** | Tak (przez Webhook)     | Nie (tylko odpytywanie)                    |
| **Wiadomości historyczne** | Nie                      | Tak (może odpytywać historię)              |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga zgody administratora + przepływu tokenu |
| **Działa offline**         | Nie (musi być uruchomione) | Tak (odpytywanie w dowolnym momencie)      |

**Najważniejsze:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrabiać pominięte wiadomości w trybie offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Multimedia i historia z włączonym Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików w **kanałach** albo chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i udzielić zgody administratora.

1. W Entra ID (Azure AD) **Rejestracja aplikacji** dodaj **uprawnienia aplikacyjne** Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanału + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Udziel zgody administratora** dla dzierżawy.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij go ponownie i **zainstaluj aplikację ponownie w Teams**.
4. **Całkowicie zamknij i uruchom ponownie Teams**, aby wyczyścić buforowane metadane aplikacji.

**Dodatkowe uprawnienie dla wzmianek o użytkownikach:** @wzmianki o użytkownikach działają od razu dla użytkowników w rozmowie. Jeśli jednak chcesz dynamicznie wyszukiwać i wzmiankować użytkowników, którzy **nie są w bieżącej rozmowie**, dodaj uprawnienie `User.Read.All` (Application) i udziel zgody administratora.

## Znane ograniczenia

### Limity czasu Webhook

Teams dostarcza wiadomości przez HTTP Webhook. Jeśli przetwarzanie trwa zbyt długo (np. wolne odpowiedzi LLM), możesz zobaczyć:

- Limity czasu Gateway
- Ponowne wysyłanie wiadomości przez Teams (powodujące duplikaty)
- Porzucone odpowiedzi

OpenClaw radzi sobie z tym, szybko zwracając odpowiedź i wysyłając odpowiedzi proaktywnie, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown Teams jest bardziej ograniczony niż Slack lub Discord:

- Działa podstawowe formatowanie: **pogrubienie**, _kursywa_, `code`, linki
- Złożony Markdown (tabele, listy zagnieżdżone) może nie renderować się poprawnie
- Adaptive Cards są obsługiwane w ankietach oraz semantycznych wysyłkach prezentacyjnych (zobacz poniżej)

## Konfiguracja

Kluczowe ustawienia (zobacz `/gateway/configuration`, aby poznać wspólne wzorce kanałów):

- `channels.msteams.enabled`: włącza/wyłącza kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: dane uwierzytelniające bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: lista dozwolonych wiadomości bezpośrednich (zalecane identyfikatory obiektów AAD). Kreator rozwiązuje nazwy na identyfikatory podczas konfiguracji, gdy dostęp do Graph jest dostępny.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny do ponownego włączenia zmiennego dopasowywania według UPN/nazwy wyświetlanej oraz bezpośredniego routingu według nazwy zespołu/kanału.
- `channels.msteams.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego.
- `channels.msteams.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić według pustych wierszy (granic akapitów) przed dzieleniem według długości.
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów dla załączników przychodzących (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista dozwolonych hostów do dołączania nagłówków Authorization przy ponownych próbach pobierania multimediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymaga @wzmianki w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie dla zespołu.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie dla zespołu.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania zasad narzędzi dla zespołu (`allow`/`deny`/`alsoAllow`) używane, gdy brakuje nadpisania kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania zasad narzędzi dla zespołu i nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie dla kanału.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie dla kanału.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania zasad narzędzi dla kanału (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania zasad narzędzi dla kanału i nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują się tylko na `id:`).
- `channels.msteams.actions.memberInfo`: włącza lub wyłącza akcję informacji o członku opartą na Graph (domyślnie: włączona, gdy dane uwierzytelniające Graph są dostępne).
- `channels.msteams.authType`: typ uwierzytelniania - `"secret"` (domyślnie) lub `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (uwierzytelnianie federacyjne + certyfikat).
- `channels.msteams.certificateThumbprint`: odcisk certyfikatu (opcjonalny, niewymagany do uwierzytelniania).
- `channels.msteams.useManagedIdentity`: włącza uwierzytelnianie tożsamością zarządzaną (tryb federacyjny).
- `channels.msteams.managedIdentityClientId`: identyfikator klienta dla tożsamości zarządzanej przypisanej przez użytkownika.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint dla przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).

## Routing i sesje

- Klucze sesji mają standardowy format agentów (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości bezpośrednie współdzielą główną sesję (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałów/grup używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki a wpisy

Teams niedawno wprowadził dwa style interfejsu kanałów nad tym samym bazowym modelem danych:

| Styl                     | Opis                                                      | Zalecane `replyStyle`   |
| ------------------------ | --------------------------------------------------------- | ----------------------- |
| **Wpisy** (klasyczne)    | Wiadomości pojawiają się jako karty z odpowiedziami w wątkach pod spodem | `thread` (domyślnie)    |
| **Wątki** (jak Slack)    | Wiadomości płyną liniowo, bardziej jak w Slack            | `top-level`             |

**Problem:** API Teams nie ujawnia, którego stylu interfejsu używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale o stylu Wątków → odpowiedzi pojawiają się niezgrabnie zagnieżdżone
- `top-level` w kanale o stylu Wpisów → odpowiedzi pojawiają się jako osobne wpisy najwyższego poziomu zamiast w wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` dla każdego kanału na podstawie sposobu konfiguracji kanału:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

### Kolejność rozstrzygania

Gdy bot wysyła odpowiedź do kanału, `replyStyle` jest rozstrzygane od najbardziej szczegółowego nadpisania do wartości domyślnej. Wygrywa pierwsza wartość różna od `undefined`:

1. **Dla kanału** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Dla zespołu** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Globalnie** — `channels.msteams.replyStyle`
4. **Niejawna wartość domyślna** — wyprowadzana z `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jeśli ustawisz globalnie `requireMention: false` bez jawnego `replyStyle`, wzmianki w kanałach o stylu Wpisów będą pojawiać się jako wpisy najwyższego poziomu, nawet jeśli przychodząca wiadomość była odpowiedzią w wątku. Ustaw `replyStyle: "thread"` na poziomie globalnym, zespołu lub kanału, aby uniknąć niespodzianek.

### Zachowanie kontekstu wątku

Gdy obowiązuje `replyStyle: "thread"` i bot został @wspomniany z wnętrza wątku kanału, OpenClaw ponownie dołącza pierwotny korzeń wątku do wychodzącego odwołania konwersacji (`19:…@thread.tacv2;messageid=<root>`), aby odpowiedź trafiła do tego samego wątku. Dotyczy to zarówno wysyłek na żywo (w ramach tej samej tury), jak i wysyłek proaktywnych wykonywanych po wygaśnięciu kontekstu tury Bot Framework (np. długo działający agenci, odpowiedzi na wywołania narzędzi w kolejce przez `mcp__openclaw__message`).

Korzeń wątku jest pobierany z zapisanego `threadId` w odwołaniu konwersacji. Starsze zapisane odwołania sprzed `threadId` używają awaryjnie `activityId` (czyli tej aktywności przychodzącej, która ostatnio zainicjowała konwersację), więc istniejące wdrożenia nadal działają bez ponownego zainicjowania.

Gdy obowiązuje `replyStyle: "top-level"`, przychodzące wiadomości z wątków kanału są celowo obsługiwane jako nowe wpisy najwyższego poziomu — nie jest dołączany sufiks wątku. To poprawne zachowanie dla kanałów o stylu Wątków; jeśli widzisz wpisy najwyższego poziomu tam, gdzie oczekiwano odpowiedzi w wątku, `replyStyle` jest nieprawidłowo ustawione dla tego kanału.

## Załączniki i obrazy

**Obecne ograniczenia:**

- **Wiadomości bezpośrednie:** Obrazy i załączniki plików działają przez API plików bota Teams.
- **Kanały/grupy:** Załączniki znajdują się w magazynie M365 (SharePoint/OneDrive). Ładunek Webhook zawiera tylko zaślepkę HTML, a nie rzeczywiste bajty pliku. **Uprawnienia Graph API są wymagane** do pobierania załączników kanału.
- Przy jawnych wysyłkach, w których plik jest pierwszy, użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się towarzyszącym tekstem/komentarzem, a `filename` nadpisuje przesłaną nazwę.

Bez uprawnień Graph wiadomości kanału z obrazami będą odbierane tylko jako tekst (treść obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera multimedia tylko z nazw hostów Microsoft/Teams. Nadpisz to przez `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów w `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Zachowaj tę listę ścisłą (unikaj sufiksów wielodzierżawowych).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w wiadomościach bezpośrednich przy użyciu przepływu FileConsentCard (wbudowanego). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Jak pliki są wysyłane                        | Wymagana konfiguracja                           |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **Wiadomości bezpośrednie** | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                                  |
| **Czaty grupowe/kanały** | Przesłanie do SharePoint → udostępnienie linku | Wymaga `sharePointSiteId` + uprawnień Graph     |
| **Obrazy (dowolny kontekst)** | Wbudowane z kodowaniem Base64              | Działa od razu                                  |

### Dlaczego czaty grupowe potrzebują SharePoint

Boty nie mają osobistego dysku OneDrive (punkt końcowy Graph API `/me/drive` nie działa dla tożsamości aplikacji). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → Rejestracja aplikacji:
   - `Sites.ReadWrite.All` (Application) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) - opcjonalne, włącza linki udostępniania dla użytkownika

2. **Udziel zgody administratora** dla dzierżawy.

3. **Uzyskaj identyfikator witryny SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Skonfiguruj OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Zachowanie udostępniania

| Uprawnienie                            | Zachowanie udostępniania                                |
| -------------------------------------- | ------------------------------------------------------- |
| Tylko `Sites.ReadWrite.All`            | Link udostępniania dla całej organizacji (dostęp ma każdy w organizacji) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link udostępniania dla użytkownika (dostęp mają tylko członkowie czatu) |

Udostępnianie dla użytkownika jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mogą uzyskać dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot wraca do udostępniania dla całej organizacji.

### Zachowanie awaryjne

| Scenariusz                                      | Wynik                                              |
| ----------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Przesłanie do SharePoint, wysłanie linku udostępniania |
| Czat grupowy + plik + brak `sharePointSiteId`   | Próba przesłania do OneDrive (może się nie powieść), wysłanie samego tekstu |
| Czat osobisty + plik                            | Przepływ FileConsentCard (działa bez SharePoint)   |
| Dowolny kontekst + obraz                        | Wbudowane z kodowaniem Base64 (działa bez SharePoint) |

### Lokalizacja przechowywania plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie ma natywnego API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Głosy są rejestrowane przez Gateway w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostać online, aby rejestrować głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik magazynu).

## Karty prezentacyjne

Wysyłaj semantyczne ładunki prezentacji do użytkowników lub konwersacji Teams za pomocą narzędzia `message` albo CLI. OpenClaw renderuje je jako Teams Adaptive Cards z ogólnego kontraktu prezentacji.

Parametr `presentation` przyjmuje bloki semantyczne. Gdy podano `presentation`, tekst wiadomości jest opcjonalny.

**Narzędzie agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Szczegóły formatu celu znajdziesz poniżej w sekcji [Formaty celów](#target-formats).

## Formaty celów

Cele MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ celu             | Format                           | Przykład                                            |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (wg ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (wg nazwy) | `user:<display-name>`            | `user:John Smith` (wymaga Graph API)                |
| Grupa/kanał          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupa/kanał (surowy) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Przykłady narzędzia agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
Bez prefiksu `user:` nazwy są domyślnie rozwiązywane jako grupa lub zespół. Zawsze używaj `user:`, gdy wskazujesz osoby według nazwy wyświetlanej.
</Note>

## Proaktywne wiadomości

- Proaktywne wiadomości są możliwe tylko **po tym**, jak użytkownik wszedł w interakcję, ponieważ w tym momencie przechowujemy odwołania do konwersacji.
- Zobacz `/gateway/configuration`, aby poznać bramkowanie `dmPolicy` i listy dozwolonych.

## Identyfikatory zespołów i kanałów (częsta pułapka)

Parametr zapytania `groupId` w adresach URL Teams **NIE** jest identyfikatorem zespołu używanym w konfiguracji. Zamiast tego wyodrębnij identyfikatory ze ścieżki URL:

**Adres URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Adres URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Dla konfiguracji:**

- Klucz zespołu = segment ścieżki po `/team/` (po zdekodowaniu URL, np. `19:Bk4j...@thread.tacv2`; starsi dzierżawcy mogą pokazywać `@thread.skype`, co także jest prawidłowe)
- Klucz kanału = segment ścieżki po `/channel/` (po zdekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId` dla routingu OpenClaw. Jest to identyfikator grupy Microsoft Entra, a nie identyfikator konwersacji Bot Framework używany w przychodzących aktywnościach Teams.

## Kanały prywatne

Boty mają ograniczoną obsługę kanałów prywatnych:

| Funkcja                        | Kanały standardowe | Kanały prywatne           |
| ------------------------------ | ------------------ | ------------------------- |
| Instalacja bota                | Tak                | Ograniczona               |
| Wiadomości w czasie rzeczywistym (webhook) | Tak | Może nie działać          |
| Uprawnienia RSC                | Tak                | Mogą działać inaczej      |
| @wzmianki                      | Tak                | Jeśli bot jest dostępny   |
| Historia Graph API             | Tak                | Tak (z uprawnieniami)     |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Użyj kanałów standardowych do interakcji z botem
2. Użyj wiadomości DM - użytkownicy zawsze mogą wysłać wiadomość bezpośrednio do bota
3. Użyj Graph API do dostępu historycznego (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie pokazują się w kanałach:** Brak uprawnień Graph lub zgody administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij oraz otwórz ponownie Teams.
- **Brak odpowiedzi w kanale:** wzmianki są domyślnie wymagane; ustaw `channels.msteams.requireMention=false` albo skonfiguruj to dla zespołu/kanału.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj aplikację ponownie, a następnie całkowicie zamknij Teams, aby odświeżyć.
- **401 Unauthorized z webhooka:** Oczekiwane przy testowaniu ręcznym bez Azure JWT - oznacza, że punkt końcowy jest osiągalny, ale uwierzytelnianie się nie powiodło. Użyj Azure Web Chat, aby przetestować poprawnie.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** Manifest odwołuje się do plików ikon, które mają 0 bajtów. Utwórz prawidłowe ikony PNG (32x32 dla `outline.png`, 192x192 dla `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikacja jest nadal zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo poczekaj 5-10 minut na propagację.
- **"Something went wrong" podczas przesyłania:** Zamiast tego prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → kartę Network i sprawdź treść odpowiedzi pod kątem rzeczywistego błędu.
- **Niepowodzenie sideload:** Spróbuj użyć "Upload an app to your org's app catalog" zamiast "Upload a custom app" - to często omija ograniczenia sideload.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij aplikację ponownie i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Materiały referencyjne

- [Utwórz Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie aplikacji Teams i zarządzanie nimi
- [Schemat manifestu aplikacji Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Odbieranie wiadomości kanału za pomocą RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Dokumentacja uprawnień RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Obsługa plików bota Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Proaktywne wiadomości](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI do zarządzania botem

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i utwardzanie
