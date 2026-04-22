---
read_when:
    - Arbeiten an Microsoft Teams-Kanalfunktionen
summary: Status, Funktionen und Konfiguration der Unterstützung für Microsoft Teams-Bots
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-22T04:19:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> „Lasst, die ihr eintretet, alle Hoffnung fahren.“

Status: Text + DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#dateien-in-gruppenchats-senden)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen explizit `upload-file` für dateizentrierte Sendungen bereit.

## Gebündeltes Plugin

Microsoft Teams wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher ist in der normalen paketierten Build keine
separate Installation erforderlich.

Wenn du eine ältere Build oder eine benutzerdefinierte Installation verwendest, die das gebündelte Teams ausschließt,
installiere es manuell:

```bash
openclaw plugins install @openclaw/msteams
```

Lokaler Checkout (beim Ausführen aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (Anfänger)

1. Stelle sicher, dass das Microsoft Teams-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstelle einen **Azure Bot** (App-ID + Client Secret + Tenant-ID).
3. Konfiguriere OpenClaw mit diesen Anmeldedaten.
4. Stelle `/api/messages` (standardmäßig Port 3978) über eine öffentliche URL oder einen Tunnel bereit.
5. Installiere das Teams-App-Paket und starte das Gateway.

Minimale Konfiguration (Client Secret):

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

Für Produktionsbereitstellungen solltest du [föderierte Authentifizierung](#föderierte-authentifizierung-zertifikat--managed-identity) (Zertifikat oder Managed Identity) anstelle von Client Secrets in Betracht ziehen.

Hinweis: Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zuzulassen, setze `channels.msteams.groupAllowFrom` (oder verwende `groupPolicy: "open"`, um jedes Mitglied zuzulassen, Mention-gesteuert).

## Ziele

- Mit OpenClaw über Teams-DMs, Gruppenchats oder Kanäle sprechen.
- Das Routing deterministisch halten: Antworten gehen immer an den Kanal zurück, auf dem sie eingegangen sind.
- Standardmäßig sicheres Kanalverhalten verwenden (Mentions erforderlich, sofern nicht anders konfiguriert).

## Konfigurationsschreibvorgänge

Standardmäßig darf Microsoft Teams Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Zugriffskontrolle (DMs + Gruppen)

**DM-Zugriff**

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden ignoriert, bis sie genehmigt werden.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs verwenden.
- UPNs/Anzeigenamen sind veränderlich; direktes Matching ist standardmäßig deaktiviert und wird nur mit `channels.msteams.dangerouslyAllowNameMatching: true` aktiviert.
- Der Assistent kann Namen über Microsoft Graph zu IDs auflösen, wenn die Anmeldedaten dies zulassen.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, außer du fügst `groupAllowFrom` hinzu). Verwende `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender in Gruppenchats/Kanälen auslösen können (fällt auf `channels.msteams.allowFrom` zurück).
- Setze `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin Mention-gesteuert).
- Um **keine Kanäle** zuzulassen, setze `channels.msteams.groupPolicy: "disabled"`.

Beispiel:

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

**Teams + Kanal-Allowlist**

- Begrenze Gruppen-/Kanalantworten, indem du Teams und Kanäle unter `channels.msteams.teams` auflistest.
- Schlüssel sollten stabile Team-IDs und Kanal-Konversations-IDs verwenden.
- Wenn `groupPolicy="allowlist"` gesetzt ist und eine Teams-Allowlist vorhanden ist, werden nur aufgelistete Teams/Kanäle akzeptiert (Mention-gesteuert).
- Der Konfigurationsassistent akzeptiert `Team/Kanal`-Einträge und speichert sie für dich.
- Beim Start löst OpenClaw Team-/Kanal- und Benutzer-Allowlist-Namen zu IDs auf (wenn Graph-Berechtigungen dies zulassen)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Kanalnamen bleiben wie eingegeben erhalten, werden aber standardmäßig für das Routing ignoriert, sofern nicht `channels.msteams.dangerouslyAllowNameMatching: true` aktiviert ist.

Beispiel:

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

## So funktioniert es

1. Stelle sicher, dass das Microsoft Teams-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstelle einen **Azure Bot** (App-ID + Secret + Tenant-ID).
3. Erstelle ein **Teams-App-Paket**, das auf den Bot verweist und die untenstehenden RSC-Berechtigungen enthält.
4. Lade die Teams-App in ein Team hoch/installiere sie dort (oder im persönlichen Bereich für DMs).
5. Konfiguriere `msteams` in `~/.openclaw/openclaw.json` (oder über Umgebungsvariablen) und starte das Gateway.
6. Das Gateway lauscht standardmäßig auf Bot Framework-Webhook-Traffic unter `/api/messages`.

## Azure Bot-Einrichtung (Voraussetzungen)

Bevor du OpenClaw konfigurierst, musst du eine Azure Bot-Ressource erstellen.

### Schritt 1: Azure Bot erstellen

1. Gehe zu [Azure Bot erstellen](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Fülle die Registerkarte **Basics** aus:

   | Feld               | Wert                                                     |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Dein Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Subscription**   | Wähle dein Azure-Abonnement aus                          |
   | **Resource group** | Neu erstellen oder vorhandene verwenden                  |
   | **Pricing tier**   | **Free** für Entwicklung/Tests                           |
   | **Type of App**    | **Single Tenant** (empfohlen – siehe Hinweis unten)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Hinweis zur Einstellung:** Die Erstellung neuer Multi-Tenant-Bots wurde nach dem 2025-07-31 eingestellt. Verwende für neue Bots **Single Tenant**.

3. Klicke auf **Review + create** → **Create** (warte ~1–2 Minuten)

### Schritt 2: Anmeldedaten abrufen

1. Gehe zu deiner Azure Bot-Ressource → **Configuration**
2. Kopiere **Microsoft App ID** → das ist deine `appId`
3. Klicke auf **Manage Password** → gehe zur App Registration
4. Unter **Certificates & secrets** → **New client secret** → kopiere den **Value** → das ist dein `appPassword`
5. Gehe zu **Overview** → kopiere **Directory (tenant) ID** → das ist deine `tenantId`

### Schritt 3: Messaging-Endpunkt konfigurieren

1. In Azure Bot → **Configuration**
2. Setze **Messaging endpoint** auf deine Webhook-URL:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwende einen Tunnel (siehe [Lokale Entwicklung](#lokale-entwicklung-tunneling) unten)

### Schritt 4: Teams-Kanal aktivieren

1. In Azure Bot → **Channels**
2. Klicke auf **Microsoft Teams** → Configure → Save
3. Akzeptiere die Nutzungsbedingungen

## Föderierte Authentifizierung (Zertifikat + Managed Identity)

> Hinzugefügt in 2026.3.24

Für Produktionsbereitstellungen unterstützt OpenClaw **föderierte Authentifizierung** als sicherere Alternative zu Client Secrets. Zwei Methoden sind verfügbar:

### Option A: Zertifikatbasierte Authentifizierung

Verwende ein PEM-Zertifikat, das in deiner Entra ID-App-Registrierung registriert ist.

**Einrichtung:**

1. Erzeuge oder beschaffe ein Zertifikat (PEM-Format mit privatem Schlüssel).
2. In Entra ID → App Registration → **Certificates & secrets** → **Certificates** → lade das öffentliche Zertifikat hoch.

**Konfiguration:**

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

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Option B: Azure Managed Identity

Verwende Azure Managed Identity für passwortlose Authentifizierung. Das ist ideal für Bereitstellungen auf Azure-Infrastruktur (AKS, App Service, Azure-VMs), bei denen eine Managed Identity verfügbar ist.

**So funktioniert es:**

1. Der Bot-Pod/die VM hat eine Managed Identity (systemzugewiesen oder benutzerzugewiesen).
2. Eine **federated identity credential** verknüpft die Managed Identity mit der Entra ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Tokens vom Azure-IMDS-Endpunkt (`169.254.169.254`) abzurufen.
4. Das Token wird zur Bot-Authentifizierung an das Teams-SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter Managed Identity (AKS workload identity, App Service, VM)
- Auf der Entra ID-App-Registrierung erstellte federated identity credential
- Netzwerkzugriff auf IMDS (`169.254.169.254:80`) vom Pod/von der VM aus

**Konfiguration (systemzugewiesene Managed Identity):**

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

**Konfiguration (benutzerzugewiesene Managed Identity):**

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

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (nur für benutzerzugewiesene)

### AKS Workload Identity-Einrichtung

Für AKS-Bereitstellungen mit Workload Identity:

1. **Aktiviere Workload Identity** auf deinem AKS-Cluster.
2. **Erstelle eine federated identity credential** für die Entra ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotiere das Kubernetes-Servicekonto** mit der App-Client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Beschrifte den Pod** für die Workload-Identity-Injektion:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Stelle Netzwerkzugriff sicher** auf IMDS (`169.254.169.254`) — wenn du NetworkPolicy verwendest, füge eine Egress-Regel hinzu, die Traffic zu `169.254.169.254/32` auf Port 80 erlaubt.

### Vergleich der Authentifizierungstypen

| Methode              | Konfiguration                                  | Vorteile                           | Nachteile                             |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client Secret**    | `appPassword`                                  | Einfache Einrichtung               | Secret-Rotation erforderlich, weniger sicher |
| **Zertifikat**       | `authType: "federated"` + `certificatePath`    | Kein gemeinsames Secret über das Netzwerk | Verwaltungsaufwand für Zertifikate    |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Passwortlos, keine Secrets zu verwalten | Azure-Infrastruktur erforderlich      |

**Standardverhalten:** Wenn `authType` nicht gesetzt ist, verwendet OpenClaw standardmäßig die Authentifizierung per Client Secret. Bestehende Konfigurationen funktionieren ohne Änderungen weiter.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwende für die lokale Entwicklung einen Tunnel:

**Option A: ngrok**

```bash
ngrok http 3978
# Kopiere die https-URL, z. B. https://abc123.ngrok.io
# Setze den Messaging-Endpunkt auf: https://abc123.ngrok.io/api/messages
```

**Option B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Verwende deine Tailscale-Funnel-URL als Messaging-Endpunkt
```

## Teams Developer Portal (Alternative)

Anstatt manuell ein Manifest-ZIP zu erstellen, kannst du das [Teams Developer Portal](https://dev.teams.microsoft.com/apps) verwenden:

1. Klicke auf **+ New app**
2. Fülle die grundlegenden Informationen aus (Name, Beschreibung, Entwicklerinfos)
3. Gehe zu **App features** → **Bot**
4. Wähle **Enter a bot ID manually** und füge deine Azure Bot App ID ein
5. Aktiviere die Bereiche: **Personal**, **Team**, **Group Chat**
6. Klicke auf **Distribute** → **Download app package**
7. In Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wähle die ZIP-Datei aus

Das ist oft einfacher, als JSON-Manifeste von Hand zu bearbeiten.

## Den Bot testen

**Option A: Azure Web Chat (zuerst den Webhook verifizieren)**

1. Im Azure-Portal → deine Azure Bot-Ressource → **Test in Web Chat**
2. Sende eine Nachricht – du solltest eine Antwort sehen
3. Das bestätigt, dass dein Webhook-Endpunkt funktioniert, bevor du Teams einrichtest

**Option B: Teams (nach der Installation der App)**

1. Installiere die Teams-App (per Sideload oder über den Org-Katalog)
2. Finde den Bot in Teams und sende eine DM
3. Prüfe die Gateway-Logs auf eingehende Aktivität

## Einrichtung (minimal, nur Text)

1. **Sicherstellen, dass das Microsoft Teams-Plugin verfügbar ist**
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell hinzufügen:
     - Von npm: `openclaw plugins install @openclaw/msteams`
     - Von einem lokalen Checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Bot-Registrierung**
   - Erstelle einen Azure Bot (siehe oben) und notiere:
     - App-ID
     - Client Secret (App-Passwort)
     - Tenant-ID (Single-Tenant)

3. **Teams-App-Manifest**
   - Füge einen `bot`-Eintrag mit `botId = <App ID>` hinzu.
   - Bereiche: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (erforderlich für die Dateiverarbeitung im persönlichen Bereich).
   - Füge RSC-Berechtigungen hinzu (unten).
   - Erstelle Icons: `outline.png` (32x32) und `color.png` (192x192).
   - Zippe alle drei Dateien zusammen: `manifest.json`, `outline.png`, `color.png`.

4. **OpenClaw konfigurieren**

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

   Du kannst statt Konfigurationsschlüsseln auch Umgebungsvariablen verwenden:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (optional: `"secret"` oder `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (föderiert + Zertifikat)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (optional, für Authentifizierung nicht erforderlich)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (föderiert + Managed Identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (nur benutzerzugewiesene MI)

5. **Bot-Endpunkt**
   - Setze den Azure Bot Messaging Endpoint auf:
     - `https://<host>:3978/api/messages` (oder deinen gewählten Pfad/Port).

6. **Gateway ausführen**
   - Der Teams-Kanal startet automatisch, wenn das gebündelte oder manuell installierte Plugin verfügbar ist und eine `msteams`-Konfiguration mit Anmeldedaten existiert.

## Aktion für Mitgliedsinformationen

OpenClaw stellt für Microsoft Teams eine Graph-gestützte `member-info`-Aktion bereit, damit Agents und Automatisierungen Mitgliederdetails eines Kanals (Anzeigename, E-Mail, Rolle) direkt aus Microsoft Graph auflösen können.

Anforderungen:

- `Member.Read.Group`-RSC-Berechtigung (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Abfragen: `User.Read.All`-Graph-Anwendungsberechtigung mit Admin-Zustimmung

Die Aktion wird über `channels.msteams.actions.memberInfo` gesteuert (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebettet werden.
- Fällt auf `messages.groupChat.historyLimit` zurück. Setze `0`, um dies zu deaktivieren (Standard 50).
- Der abgerufene Thread-Verlauf wird nach Absender-Allowlists gefiltert (`allowFrom` / `groupAllowFrom`), sodass das Seeding des Thread-Kontexts nur Nachrichten von erlaubten Absendern enthält.
- Zitierter Anhangskontext (`ReplyTo*`, aus Teams-Antwort-HTML abgeleitet) wird derzeit unverändert übergeben.
- Anders gesagt: Allowlists steuern, wer den Agent auslösen kann; heute werden nur bestimmte ergänzende Kontextpfade gefiltert.
- Der DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` begrenzt werden (Benutzer-Turns). Pro-Benutzer-Überschreibungen: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **bestehenden resourceSpecific-Berechtigungen** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Team-Bereich):**

- `ChannelMessage.Read.Group` (Application) - alle Kanalnachrichten ohne @mention empfangen
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Application) - alle Gruppenchats ohne @mention empfangen

## Beispiel für ein Teams-Manifest (redigiert)

Minimales, gültiges Beispiel mit den erforderlichen Feldern. Ersetze IDs und URLs.

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

### Hinweise zum Manifest (Pflichtfelder)

- `bots[].botId` **muss** mit der Azure Bot App ID übereinstimmen.
- `webApplicationInfo.id` **muss** mit der Azure Bot App ID übereinstimmen.
- `bots[].scopes` muss die Bereiche enthalten, die du verwenden möchtest (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Bereich erforderlich.
- `authorization.permissions.resourceSpecific` muss Lesen/Senden für Kanäle enthalten, wenn du Kanal-Traffic möchtest.

### Eine vorhandene App aktualisieren

So aktualisierst du eine bereits installierte Teams-App (z. B. um RSC-Berechtigungen hinzuzufügen):

1. Aktualisiere deine `manifest.json` mit den neuen Einstellungen
2. **Erhöhe das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Zippe** das Manifest erneut zusammen mit den Icons (`manifest.json`, `outline.png`, `color.png`)
4. Lade die neue ZIP hoch:
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → finde deine App → Upload new version
   - **Option B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Für Team-Kanäle:** Installiere die App in jedem Team erneut, damit neue Berechtigungen wirksam werden
6. **Beende Teams vollständig und starte es neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu löschen

## Funktionen: nur RSC vs. Graph

### Mit **nur Teams RSC** (App installiert, keine Graph-API-Berechtigungen)

Funktioniert:

- Kanalnachrichten mit **Textinhalt** lesen.
- Kanalnachrichten mit **Textinhalt** senden.
- **Persönliche (DM)** Dateianhänge empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Kanal/Gruppen (Payload enthält nur einen HTML-Stub).
- Herunterladen von Anhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Nachrichtenverlaufs (über das Live-Webhook-Ereignis hinaus).

### Mit **Teams RSC + Microsoft Graph-Anwendungsberechtigungen**

Zusätzlich möglich:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von Dateianhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Kanal-/Chat-Nachrichtenverlaufs über Graph.

### RSC vs. Graph API

| Fähigkeit              | RSC-Berechtigungen   | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Echtzeitnachrichten**| Ja (über Webhook)    | Nein (nur Polling)                  |
| **Verlaufsnachrichten**| Nein                 | Ja (Verlauf kann abgefragt werden)  |
| **Einrichtungskomplexität** | Nur App-Manifest | Erfordert Admin-Zustimmung + Token-Flow |
| **Funktioniert offline** | Nein (muss laufen) | Ja (jederzeit abfragbar)            |

**Kurz gesagt:** RSC ist für Zuhören in Echtzeit; Graph API ist für historischen Zugriff. Um verpasste Nachrichten im Offline-Betrieb nachzuholen, benötigst du Graph API mit `ChannelMessage.Read.All` (erfordert Admin-Zustimmung).

## Graph-aktivierte Medien + Verlauf (erforderlich für Kanäle)

Wenn du Bilder/Dateien in **Kanälen** benötigst oder den **Nachrichtenverlauf** abrufen möchtest, musst du Microsoft Graph-Berechtigungen aktivieren und Admin-Zustimmung erteilen.

1. Füge in der Entra ID (Azure AD) **App Registration** Microsoft Graph-**Anwendungsberechtigungen** hinzu:
   - `ChannelMessage.Read.All` (Kanalanhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteile Admin-Zustimmung** für den Tenant.
3. Erhöhe die **Manifestversion** der Teams-App, lade sie erneut hoch und **installiere die App in Teams neu**.
4. **Beende Teams vollständig und starte es neu**, um zwischengespeicherte App-Metadaten zu löschen.

**Zusätzliche Berechtigung für Benutzer-Mentions:** Benutzer-@mentions funktionieren für Benutzer in der Konversation sofort. Wenn du jedoch Benutzer dynamisch suchen und erwähnen möchtest, die **nicht Teil der aktuellen Konversation** sind, füge die Anwendungsberechtigung `User.Read.All` hinzu und erteile Admin-Zustimmung.

## Bekannte Einschränkungen

### Webhook-Timeouts

Teams liefert Nachrichten per HTTP-Webhook. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), kann Folgendes auftreten:

- Gateway-Timeouts
- Teams versucht erneut, die Nachricht zuzustellen (verursacht Duplikate)
- Verlorene Antworten

OpenClaw verarbeitet dies, indem es schnell antwortet und Antworten proaktiv sendet, aber sehr langsame Antworten können weiterhin Probleme verursachen.

### Formatierung

Teams-Markdown ist stärker eingeschränkt als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt gerendert
- Adaptive Cards werden für Umfragen und semantische Darstellungssendungen unterstützt (siehe unten)

## Konfiguration

Wichtige Einstellungen (siehe `/gateway/configuration` für gemeinsame Kanalmuster):

- `channels.msteams.enabled`: den Kanal aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.webhook.port` (Standard `3978`)
- `channels.msteams.webhook.path` (Standard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing)
- `channels.msteams.allowFrom`: DM-Allowlist (AAD-Objekt-IDs empfohlen). Der Assistent löst Namen während der Einrichtung zu IDs auf, wenn Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Break-Glass-Schalter, um veränderliches UPN-/Anzeigenamen-Matching und direktes Team-/Kanal-Namensrouting wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Chunk-Größe für ausgehenden Text.
- `channels.msteams.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.msteams.mediaAllowHosts`: Allowlist für eingehende Anhang-Hosts (standardmäßig Microsoft-/Teams-Domains).
- `channels.msteams.mediaAuthAllowHosts`: Allowlist zum Anhängen von Authorization-Headern bei Medien-Wiederholungen (standardmäßig Graph- + Bot-Framework-Hosts).
- `channels.msteams.requireMention`: @mention in Kanälen/Gruppen verlangen (Standard true).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#antwortstil-threads-vs-beiträge)).
- `channels.msteams.teams.<teamId>.replyStyle`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.requireMention`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.tools`: Standardüberschreibungen der Tool-Richtlinie pro Team (`allow`/`deny`/`alsoAllow`), verwendet, wenn eine Kanalüberschreibung fehlt.
- `channels.msteams.teams.<teamId>.toolsBySender`: Standardüberschreibungen der Tool-Richtlinie pro Team und Absender (`"*"`-Wildcard unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: Überschreibungen der Tool-Richtlinie pro Kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: Überschreibungen der Tool-Richtlinie pro Kanal und Absender (`"*"`-Wildcard unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden:
  `id:`, `e164:`, `username:`, `name:` (alte Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet).
- `channels.msteams.actions.memberInfo`: die Graph-gestützte Aktion für Mitgliedsinformationen aktivieren oder deaktivieren (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).
- `channels.msteams.authType`: Authentifizierungstyp — `"secret"` (Standard) oder `"federated"`.
- `channels.msteams.certificatePath`: Pfad zur PEM-Zertifikatsdatei (föderiert + Zertifikatsauthentifizierung).
- `channels.msteams.certificateThumbprint`: Zertifikats-Thumbprint (optional, für die Authentifizierung nicht erforderlich).
- `channels.msteams.useManagedIdentity`: Managed-Identity-Authentifizierung aktivieren (föderierter Modus).
- `channels.msteams.managedIdentityClientId`: Client-ID für benutzerzugewiesene Managed Identity.
- `channels.msteams.sharePointSiteId`: SharePoint-Site-ID für Datei-Uploads in Gruppenchats/Kanälen (siehe [Dateien in Gruppenchats senden](#dateien-in-gruppenchats-senden)).

## Routing & Sitzungen

- Sitzungsschlüssel folgen dem Standardformat für Agents (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten teilen sich die Hauptsitzung (`agent:<agentId>:<mainKey>`).
  - Kanal-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads vs. Beiträge

Teams hat vor Kurzem zwei Kanal-UI-Stile über demselben zugrunde liegenden Datenmodell eingeführt:

| Stil                     | Beschreibung                                             | Empfohlener `replyStyle` |
| ------------------------ | -------------------------------------------------------- | ------------------------ |
| **Posts** (klassisch)    | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard)      |
| **Threads** (wie Slack)  | Nachrichten fließen linear, eher wie in Slack            | `top-level`              |

**Das Problem:** Die Teams-API gibt nicht an, welchen UI-Stil ein Kanal verwendet. Wenn du den falschen `replyStyle` verwendest:

- `thread` in einem Kanal im Threads-Stil → Antworten erscheinen ungeschickt verschachtelt
- `top-level` in einem Kanal im Posts-Stil → Antworten erscheinen als separate Top-Level-Beiträge statt im Thread

**Lösung:** Konfiguriere `replyStyle` pro Kanal basierend darauf, wie der Kanal eingerichtet ist:

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

## Anhänge & Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Dateianhänge funktionieren über die Teams-Bot-Datei-APIs.
- **Kanäle/Gruppen:** Anhänge liegen im M365-Speicher (SharePoint/OneDrive). Die Webhook-Payload enthält nur einen HTML-Stub, nicht die tatsächlichen Dateibytes. **Graph-API-Berechtigungen sind erforderlich**, um Kanalanhänge herunterzuladen.
- Für explizite dateizentrierte Sendungen verwende `action=upload-file` mit `media` / `filePath` / `path`; optionales `message` wird zum Begleittext/-kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Kanalnachrichten mit Bildern nur als Text empfangen (auf den Bildinhalt kann der Bot nicht zugreifen).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreibe dies mit `channels.msteams.mediaAllowHosts` (verwende `["*"]`, um beliebige Hosts zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- + Bot-Framework-Hosts). Halte diese Liste strikt (vermeide Suffixe für mehrere Tenants).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs mit dem FileConsentCard-Flow senden (integriert). **Das Senden von Dateien in Gruppenchats/Kanälen** erfordert jedoch zusätzliche Einrichtung:

| Kontext                  | Wie Dateien gesendet werden                 | Erforderliche Einrichtung                        |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **DMs**                  | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                              |
| **Gruppenchats/Kanäle**  | Upload zu SharePoint → Freigabelink         | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (beliebiger Kontext)** | Base64-kodiert inline                 | Funktioniert sofort                              |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der Graph-API-Endpunkt `/me/drive` funktioniert nicht für Anwendungsidentitäten). Um Dateien in Gruppenchats/Kanälen zu senden, lädt der Bot sie in eine **SharePoint-Site** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Füge Graph-API-Berechtigungen hinzu** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - Dateien zu SharePoint hochladen
   - `Chat.Read.All` (Application) - optional, aktiviert Freigabelinks pro Benutzer

2. **Erteile Admin-Zustimmung** für den Tenant.

3. **Hole deine SharePoint-Site-ID:**

   ```bash
   # Über Graph Explorer oder curl mit einem gültigen Token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Beispiel: für eine Site unter "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Die Antwort enthält: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw konfigurieren:**

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

### Freigabeverhalten

| Berechtigung                            | Freigabeverhalten                                        |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` nur               | organisationsweiter Freigabelink (jeder in der Organisation kann zugreifen) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Freigabelink pro Benutzer (nur Chatmitglieder können zugreifen) |

Die Freigabe pro Benutzer ist sicherer, da nur die Chat-Teilnehmer auf die Datei zugreifen können. Wenn die Berechtigung `Chat.Read.All` fehlt, greift der Bot auf organisationsweite Freigabe zurück.

### Fallback-Verhalten

| Szenario                                          | Ergebnis                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + `sharePointSiteId` konfiguriert | Upload zu SharePoint, Freigabelink senden      |
| Gruppenchat + Datei + keine `sharePointSiteId`    | OneDrive-Upload versuchen (kann fehlschlagen), nur Text senden |
| Persönlicher Chat + Datei                         | FileConsentCard-Flow (funktioniert ohne SharePoint) |
| Beliebiger Kontext + Bild                         | Base64-kodiert inline (funktioniert ohne SharePoint) |

### Speicherort der Dateien

Hochgeladene Dateien werden in einem Ordner `/OpenClawShared/` in der Standarddokumentbibliothek der konfigurierten SharePoint-Site gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-API für Umfragen).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` gespeichert.
- Das Gateway muss online bleiben, um Stimmen zu erfassen.
- Umfragen veröffentlichen noch keine Ergebniszusammenfassungen automatisch (prüfe bei Bedarf die Store-Datei).

## Darstellungskarten

Sende semantische Darstellungs-Payloads an Teams-Benutzer oder Konversationen mit dem Tool `message` oder über die CLI. OpenClaw rendert sie aus dem generischen Darstellungsvertrag als Teams Adaptive Cards.

Der Parameter `presentation` akzeptiert semantische Blöcke. Wenn `presentation` angegeben ist, ist der Nachrichtentext optional.

**Agent-Tool:**

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

Einzelheiten zum Zielformat siehe [Zielformate](#zielformate) unten.

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Konversationen zu unterscheiden:

| Zieltyp                 | Format                           | Beispiel                                            |
| ----------------------- | -------------------------------- | --------------------------------------------------- |
| Benutzer (nach ID)      | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Benutzer (nach Name)    | `user:<display-name>`            | `user:John Smith` (erfordert Graph API)             |
| Gruppe/Kanal            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppe/Kanal (roh)      | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

```bash
# An einen Benutzer per ID senden
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# An einen Benutzer per Anzeigename senden (löst eine Graph-API-Suche aus)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# An einen Gruppenchat oder Kanal senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Eine Darstellungskarte an eine Konversation senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Beispiele für Agent-Tools:**

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

Hinweis: Ohne das Präfix `user:` werden Namen standardmäßig als Gruppen-/Team-Auflösung behandelt. Verwende immer `user:`, wenn du Personen per Anzeigename ansprichst.

## Proaktive Nachrichten

- Proaktive Nachrichten sind nur **nachdem** ein Benutzer interagiert hat möglich, da wir erst dann Konversationsreferenzen speichern.
- Siehe `/gateway/configuration` für `dmPolicy` und Allowlist-Gating.

## Team- und Kanal-IDs (häufiger Stolperstein)

Der Abfrageparameter `groupId` in Teams-URLs ist **NICHT** die Team-ID, die für die Konfiguration verwendet wird. Extrahiere IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team-ID (URL-dekodiere dies)
```

**Kanal-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal-ID (URL-dekodieren)
```

**Für die Konfiguration:**

- Team-ID = Pfadsegment nach `/team/` (URL-dekodiert, z. B. `19:Bk4j...@thread.tacv2`)
- Kanal-ID = Pfadsegment nach `/channel/` (URL-dekodiert)
- Den Abfrageparameter `groupId` **ignorieren**

## Private Kanäle

Bots werden in privaten Kanälen nur eingeschränkt unterstützt:

| Funktion                     | Standardkanäle    | Private Kanäle        |
| --------------------------- | ----------------- | --------------------- |
| Bot-Installation            | Ja                | Eingeschränkt         |
| Echtzeitnachrichten (Webhook) | Ja              | Funktioniert evtl. nicht |
| RSC-Berechtigungen          | Ja                | Verhalten evtl. abweichend |
| @mentions                   | Ja                | Wenn der Bot zugänglich ist |
| Graph-API-Verlauf           | Ja                | Ja (mit Berechtigungen) |

**Workarounds, wenn private Kanäle nicht funktionieren:**

1. Verwende Standardkanäle für Bot-Interaktionen
2. Verwende DMs – Benutzer können dem Bot immer direkt schreiben
3. Verwende die Graph API für historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installiere die Teams-App neu und beende/öffne Teams vollständig neu.
- **Keine Antworten im Kanal:** Mentions sind standardmäßig erforderlich; setze `channels.msteams.requireMention=false` oder konfiguriere dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt weiterhin altes Manifest):** Entferne die App und füge sie erneut hinzu und beende Teams vollständig, um die Aktualisierung zu erzwingen.
- **401 Unauthorized vom Webhook:** Erwartet bei manuellen Tests ohne Azure-JWT – bedeutet, dass der Endpunkt erreichbar ist, aber die Authentifizierung fehlgeschlagen ist. Verwende Azure Web Chat zum ordnungsgemäßen Testen.

### Fehler beim Manifest-Upload

- **"Icon file cannot be empty":** Das Manifest verweist auf Icon-Dateien mit 0 Byte. Erstelle gültige PNG-Icons (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Finde sie und deinstalliere sie zuerst oder warte 5–10 Minuten auf die Übernahme.
- **"Something went wrong" beim Upload:** Lade stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffne die Browser-DevTools (F12) → Registerkarte Network und prüfe den Response-Body auf den tatsächlichen Fehler.
- **Sideload schlägt fehl:** Versuche „Upload an app to your org's app catalog“ statt „Upload a custom app“ – das umgeht oft Sideload-Beschränkungen.

### RSC-Berechtigungen funktionieren nicht

1. Verifiziere, dass `webApplicationInfo.id` exakt mit der App-ID deines Bots übereinstimmt
2. Lade die App erneut hoch und installiere sie im Team/Chat neu
3. Prüfe, ob dein Org-Admin RSC-Berechtigungen blockiert hat
4. Bestätige, dass du den richtigen Bereich verwendest: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Leitfaden zur Azure-Bot-Einrichtung
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanalnachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referenz für RSC-Berechtigungen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams-Bot-Dateiverarbeitung](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proaktive Nachrichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
