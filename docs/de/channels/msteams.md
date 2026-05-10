---
read_when:
    - Arbeiten an Microsoft Teams-Kanalfunktionen
summary: Supportstatus, Funktionen und Konfiguration für den Microsoft Teams-Bot
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:22:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

Status: Text- und DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen explizit `upload-file` für datei-zuerst-Sendungen bereit.

## Gebündeltes Plugin

Microsoft Teams wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher ist im normalen Paket-Build keine separate Installation erforderlich.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die das gebündelte Teams ausschließt, installieren Sie das npm-Paket direkt:

```bash
openclaw plugins install @openclaw/msteams
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte Version nur, wenn Sie eine reproduzierbare Installation benötigen.

Lokaler Checkout (wenn Sie aus einem Git-Repo ausführen):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

Die [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) übernimmt Bot-Registrierung, Manifest-Erstellung und Anmeldedaten-Generierung mit einem einzigen Befehl.

**1. Installieren und anmelden**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Die Teams CLI befindet sich derzeit in der Vorschau. Befehle und Flags können sich zwischen Versionen ändern.
</Note>

**2. Tunnel starten** (Teams kann localhost nicht erreichen)

Installieren und authentifizieren Sie die devtunnel CLI, falls noch nicht geschehen ([Einstiegsleitfaden](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` ist erforderlich, weil Teams sich nicht bei devtunnels authentifizieren kann. Jede eingehende Bot-Anfrage wird weiterhin automatisch vom Teams SDK validiert.
</Note>

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (diese können jedoch in jeder Sitzung die URLs ändern).

**3. App erstellen**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Dieser einzelne Befehl:

- Erstellt eine Entra ID (Azure AD)-Anwendung
- Generiert ein Client Secret
- Erstellt ein Teams-App-Manifest (mit Icons) und lädt es hoch
- Registriert den Bot (standardmäßig Teams-verwaltet - kein Azure-Abonnement erforderlich)

Die Ausgabe zeigt `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` und eine **Teams App ID** - notieren Sie diese für die nächsten Schritte. Sie bietet außerdem an, die App direkt in Teams zu installieren.

**4. OpenClaw konfigurieren** mit den Anmeldedaten aus der Ausgabe:

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

Oder verwenden Sie Umgebungsvariablen direkt: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. App in Teams installieren**

`teams app create` fordert Sie auf, die App zu installieren - wählen Sie „In Teams installieren“. Wenn Sie diesen Schritt übersprungen haben, können Sie den Link später abrufen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Prüfen, ob alles funktioniert**

```bash
teams app doctor <teamsAppId>
```

Dies führt Diagnosen für Bot-Registrierung, AAD-App-Konfiguration, Manifest-Gültigkeit und SSO-Einrichtung aus.

Für Produktionsbereitstellungen sollten Sie [föderierte Authentifizierung](/de/channels/msteams#federated-authentication-certificate-plus-managed-identity) (Zertifikat oder verwaltete Identität) anstelle von Client Secrets in Betracht ziehen.

<Note>
Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zu erlauben, setzen Sie `channels.msteams.groupAllowFrom`, oder verwenden Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (durch Erwähnungen gesteuert).
</Note>

## Ziele

- Mit OpenClaw über Teams-DMs, Gruppenchats oder Kanäle sprechen.
- Routing deterministisch halten: Antworten gehen immer zurück an den Kanal, über den sie eingegangen sind.
- Standardmäßig sicheres Kanalverhalten verwenden (Erwähnungen erforderlich, sofern nicht anders konfiguriert).

## Konfigurationsschreibvorgänge

Standardmäßig darf Microsoft Teams Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Zugriffssteuerung (DMs + Gruppen)

**DM-Zugriff**

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden ignoriert, bis sie genehmigt wurden.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs oder statische Absenderzugriffsgruppen wie `accessGroup:core-team` verwenden.
- Verlassen Sie sich nicht auf UPN-/Anzeigenamen-Abgleich für Allowlists - diese können sich ändern. OpenClaw deaktiviert direkten Namensabgleich standardmäßig; aktivieren Sie ihn explizit mit `channels.msteams.dangerouslyAllowNameMatching: true`.
- Der Assistent kann Namen über Microsoft Graph in IDs auflösen, wenn die Anmeldedaten dies erlauben.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, sofern Sie `groupAllowFrom` nicht hinzufügen). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender oder statischen Absenderzugriffsgruppen in Gruppenchats/Kanälen auslösen können (fällt auf `channels.msteams.allowFrom` zurück).
- Setzen Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin durch Erwähnungen gesteuert).
- Um **keine Kanäle** zuzulassen, setzen Sie `channels.msteams.groupPolicy: "disabled"`.

Beispiel:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams- und Kanal-Allowlist**

- Begrenzen Sie Gruppen-/Kanalantworten, indem Sie Teams und Kanäle unter `channels.msteams.teams` auflisten.
- Schlüssel sollten stabile Teams-Konversations-IDs aus Teams-Links verwenden, nicht veränderliche Anzeigenamen.
- Wenn `groupPolicy="allowlist"` gesetzt ist und eine Teams-Allowlist vorhanden ist, werden nur gelistete Teams/Kanäle akzeptiert (durch Erwähnungen gesteuert).
- Der Konfigurationsassistent akzeptiert `Team/Channel`-Einträge und speichert sie für Sie.
- Beim Start löst OpenClaw Team-/Kanal- und Benutzer-Allowlist-Namen in IDs auf (wenn Graph-Berechtigungen dies erlauben)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Kanalnamen werden wie eingegeben beibehalten, aber standardmäßig für das Routing ignoriert, sofern `channels.msteams.dangerouslyAllowNameMatching: true` nicht aktiviert ist.

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

<details>
<summary><strong>Manuelle Einrichtung (ohne die Teams CLI)</strong></summary>

Wenn Sie die Teams CLI nicht verwenden können, können Sie den Bot manuell über das Azure Portal einrichten.

### Funktionsweise

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist (in aktuellen Versionen gebündelt).
2. Erstellen Sie einen **Azure Bot** (App-ID + Secret + Tenant-ID).
3. Erstellen Sie ein **Teams-App-Paket**, das auf den Bot verweist und die unten aufgeführten RSC-Berechtigungen enthält.
4. Laden Sie die Teams-App in ein Team hoch/installieren Sie sie (oder im persönlichen Bereich für DMs).
5. Konfigurieren Sie `msteams` in `~/.openclaw/openclaw.json` (oder über Umgebungsvariablen) und starten Sie den Gateway.
6. Der Gateway lauscht standardmäßig auf Bot Framework-Webhook-Verkehr unter `/api/messages`.

### Schritt 1: Azure Bot erstellen

1. Gehen Sie zu [Azure Bot erstellen](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Füllen Sie den Tab **Grundlagen** aus:

   | Feld               | Wert                                                     |
   | ------------------ | -------------------------------------------------------- |
   | **Bot-Handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Abonnement**     | Wählen Sie Ihr Azure-Abonnement                          |
   | **Ressourcengruppe** | Neu erstellen oder vorhandene verwenden                |
   | **Tarifstufe**     | **Free** für Entwicklung/Tests                           |
   | **App-Typ**        | **Single Tenant** (empfohlen - siehe Hinweis unten)      |
   | **Erstellungstyp** | **Neue Microsoft App ID erstellen**                      |

<Warning>
Das Erstellen neuer mandantenfähiger Bots wurde nach dem 2025-07-31 eingestellt. Verwenden Sie **Single Tenant** für neue Bots.
</Warning>

3. Klicken Sie auf **Überprüfen + erstellen** → **Erstellen** (warten Sie ca. 1-2 Minuten)

### Schritt 2: Anmeldedaten abrufen

1. Gehen Sie zu Ihrer Azure Bot-Ressource → **Konfiguration**
2. Kopieren Sie **Microsoft App ID** → dies ist Ihre `appId`
3. Klicken Sie auf **Kennwort verwalten** → gehen Sie zur App-Registrierung
4. Unter **Zertifikate & Secrets** → **Neues Client Secret** → kopieren Sie den **Wert** → dies ist Ihr `appPassword`
5. Gehen Sie zu **Übersicht** → kopieren Sie **Verzeichnis-ID (Mandant)** → dies ist Ihre `tenantId`

### Schritt 3: Messaging-Endpunkt konfigurieren

1. In Azure Bot → **Konfiguration**
2. Setzen Sie **Messaging-Endpunkt** auf Ihre Webhook-URL:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe [Lokale Entwicklung](#local-development-tunneling) unten)

### Schritt 4: Teams-Kanal aktivieren

1. In Azure Bot → **Kanäle**
2. Klicken Sie auf **Microsoft Teams** → Konfigurieren → Speichern
3. Akzeptieren Sie die Nutzungsbedingungen

### Schritt 5: Teams-App-Manifest erstellen

- Fügen Sie einen `bot`-Eintrag mit `botId = <App ID>` hinzu.
- Bereiche: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (erforderlich für die Dateiverarbeitung im persönlichen Bereich).
- Fügen Sie RSC-Berechtigungen hinzu (siehe [RSC-Berechtigungen](#current-teams-rsc-permissions-manifest)).
- Erstellen Sie Icons: `outline.png` (32x32) und `color.png` (192x192).
- Packen Sie alle drei Dateien zusammen als Zip: `manifest.json`, `outline.png`, `color.png`.

### Schritt 6: OpenClaw konfigurieren

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

Umgebungsvariablen: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Schritt 7: Gateway ausführen

Der Teams-Kanal startet automatisch, wenn das Plugin verfügbar ist und eine `msteams`-Konfiguration mit Anmeldedaten existiert.

</details>

## Föderierte Authentifizierung (Zertifikat plus verwaltete Identität)

> Hinzugefügt in 2026.4.11

Für Produktionsbereitstellungen unterstützt OpenClaw **föderierte Authentifizierung** als sicherere Alternative zu Client Secrets. Zwei Methoden sind verfügbar:

### Option A: Zertifikatbasierte Authentifizierung

Verwenden Sie ein PEM-Zertifikat, das bei Ihrer Entra ID-App-Registrierung registriert ist.

**Einrichtung:**

1. Generieren oder beziehen Sie ein Zertifikat (PEM-Format mit privatem Schlüssel).
2. In Entra ID → App-Registrierung → **Zertifikate & Secrets** → **Zertifikate** → Laden Sie das öffentliche Zertifikat hoch.

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

Verwenden Sie Azure Managed Identity für kennwortlose Authentifizierung. Dies ist ideal für Bereitstellungen auf Azure-Infrastruktur (AKS, App Service, Azure VMs), bei denen eine verwaltete Identität verfügbar ist.

**Funktionsweise:**

1. Der Bot-Pod/die VM verfügt über eine verwaltete Identität (systemseitig oder benutzerseitig zugewiesen).
2. Eine **föderierte Identitätsanmeldeinformation** verknüpft die verwaltete Identität mit der Entra ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Tokens vom Azure IMDS-Endpunkt (`169.254.169.254`) abzurufen.
4. Das Token wird zur Bot-Authentifizierung an das Teams SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter verwalteter Identität (AKS Workload Identity, App Service, VM)
- Föderierte Identitätsanmeldeinformation, die in der Entra ID-App-Registrierung erstellt wurde
- Netzwerkzugriff auf IMDS (`169.254.169.254:80`) vom Pod/von der VM

**Konfiguration (systemseitig zugewiesene verwaltete Identität):**

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

**Konfiguration (vom Benutzer zugewiesene verwaltete Identität):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (nur für vom Benutzer zugewiesene)

### Einrichtung von AKS Workload Identity

Für AKS-Bereitstellungen mit Workload Identity:

1. **Aktivieren Sie Workload Identity** in Ihrem AKS-Cluster.
2. **Erstellen Sie einen Anmeldenachweis für eine föderierte Identität** in der Entra-ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotieren Sie das Kubernetes-Dienstkonto** mit der App-Client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Kennzeichnen Sie den Pod** für die Workload-Identity-Injektion:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Stellen Sie Netzwerkzugriff** auf IMDS (`169.254.169.254`) sicher. Wenn Sie NetworkPolicy verwenden, fügen Sie eine Egress-Regel hinzu, die Traffic zu `169.254.169.254/32` auf Port 80 erlaubt.

### Vergleich der Authentifizierungstypen

| Methode                | Konfiguration                                  | Vorteile                               | Nachteile                                          |
| ---------------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| **Client-Geheimnis**   | `appPassword`                                  | Einfache Einrichtung                   | Rotation von Geheimnissen erforderlich, weniger sicher |
| **Zertifikat**         | `authType: "federated"` + `certificatePath`    | Kein gemeinsam genutztes Geheimnis über das Netzwerk | Verwaltungsaufwand für Zertifikate                 |
| **Managed Identity**   | `authType: "federated"` + `useManagedIdentity` | Kennwortlos, keine Geheimnisse zu verwalten | Azure-Infrastruktur erforderlich                   |

**Standardverhalten:** Wenn `authType` nicht gesetzt ist, verwendet OpenClaw standardmäßig die Authentifizierung per Client-Geheimnis. Bestehende Konfigurationen funktionieren weiterhin ohne Änderungen.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie einen persistenten Entwicklungstunnel, damit Ihre URL über Sitzungen hinweg gleich bleibt:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (URLs können sich pro Sitzung ändern).

Wenn sich Ihre Tunnel-URL ändert, aktualisieren Sie den Endpunkt:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Bot testen

**Diagnose ausführen:**

```bash
teams app doctor <teamsAppId>
```

Prüft Bot-Registrierung, AAD-App, Manifest und SSO-Konfiguration in einem Durchlauf.

**Eine Testnachricht senden:**

1. Installieren Sie die Teams-App (verwenden Sie den Installationslink aus `teams app get <id> --install-link`)
2. Suchen Sie den Bot in Teams und senden Sie ihm eine Direktnachricht
3. Prüfen Sie die Gateway-Protokolle auf eingehende Aktivität

## Umgebungsvariablen

Alle Konfigurationsschlüssel können stattdessen über Umgebungsvariablen gesetzt werden:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (optional: `"secret"` oder `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (föderiert + Zertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (optional, für die Authentifizierung nicht erforderlich)
- `MSTEAMS_USE_MANAGED_IDENTITY` (föderiert + verwaltete Identität)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (nur vom Benutzer zugewiesene MI)

## Aktion für Mitgliedsinformationen

OpenClaw stellt für Microsoft Teams eine Graph-gestützte Aktion `member-info` bereit, damit Agenten und Automatisierungen Details zu Kanalmitgliedern (Anzeigename, E-Mail, Rolle) direkt aus Microsoft Graph auflösen können.

Anforderungen:

- RSC-Berechtigung `Member.Read.Group` (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Abfragen: Graph-Anwendungsberechtigung `User.Read.All` mit Administratorzustimmung

Die Aktion wird durch `channels.msteams.actions.memberInfo` gesteuert (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebettet werden.
- Fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).
- Abgerufene Thread-Verläufe werden nach Absender-Allowlists (`allowFrom` / `groupAllowFrom`) gefiltert, sodass die Thread-Kontextinitialisierung nur Nachrichten von zugelassenen Absendern enthält.
- Kontext aus zitierten Anhängen (`ReplyTo*`, abgeleitet aus Teams-Antwort-HTML) wird derzeit unverändert weitergegeben.
- Anders gesagt: Allowlists steuern, wer den Agenten auslösen kann; nur bestimmte ergänzende Kontextpfade werden derzeit gefiltert.
- DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` (Benutzer-Turns) begrenzt werden. Benutzerbezogene Überschreibungen: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **bestehenden resourceSpecific-Berechtigungen** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Team-Scope):**

- `ChannelMessage.Read.Group` (Application) - alle Kanalnachrichten ohne @Erwähnung empfangen
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Application) - alle Gruppenchatnachrichten ohne @Erwähnung empfangen

So fügen Sie RSC-Berechtigungen über die Teams-CLI hinzu:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Beispiel für ein Teams-Manifest (redigiert)

Minimales, gültiges Beispiel mit den erforderlichen Feldern. Ersetzen Sie IDs und URLs.

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

### Manifest-Hinweise (Pflichtfelder)

- `bots[].botId` **muss** der Azure-Bot-App-ID entsprechen.
- `webApplicationInfo.id` **muss** der Azure-Bot-App-ID entsprechen.
- `bots[].scopes` muss die Oberflächen enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Scope erforderlich.
- `authorization.permissions.resourceSpecific` muss Lesen/Senden für Kanäle enthalten, wenn Sie Kanal-Traffic verwenden möchten.

### Eine bestehende App aktualisieren

So aktualisieren Sie eine bereits installierte Teams-App (z. B. zum Hinzufügen von RSC-Berechtigungen):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Nach der Aktualisierung installieren Sie die App in jedem Team neu, damit neue Berechtigungen wirksam werden, und **beenden und starten Sie Teams vollständig neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu löschen.

<details>
<summary>Manuelle Manifest-Aktualisierung (ohne CLI)</summary>

1. Aktualisieren Sie Ihre `manifest.json` mit den neuen Einstellungen
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Zippen Sie** das Manifest mit Symbolen neu (`manifest.json`, `outline.png`, `color.png`)
4. Laden Sie die neue ZIP-Datei hoch:
   - **Teams Admin Center:** Teams-Apps → Apps verwalten → Ihre App suchen → Neue Version hochladen
   - **Sideload:** In Teams → Apps → Ihre Apps verwalten → Benutzerdefinierte App hochladen

</details>

## Funktionen: Nur RSC vs. Graph

### Nur mit **Teams RSC** (App installiert, keine Graph-API-Berechtigungen)

Funktioniert:

- **Text**inhalt von Kanalnachrichten lesen.
- **Text**inhalt von Kanalnachrichten senden.
- Dateianhänge in **persönlichen Nachrichten (DMs)** empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Kanälen/Gruppen (Payload enthält nur HTML-Stub).
- Anhänge herunterladen, die in SharePoint/OneDrive gespeichert sind.
- Nachrichtenverlauf lesen (über das Live-Webhook-Ereignis hinaus).

### Mit **Teams RSC + Microsoft Graph-Anwendungsberechtigungen**

Fügt hinzu:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von Dateianhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Kanal-/Chatnachrichtenverlaufs über Graph.

### RSC vs. Graph-API

| Funktion                 | RSC-Berechtigungen   | Graph-API                           |
| ------------------------ | -------------------- | ----------------------------------- |
| **Echtzeitnachrichten**  | Ja (per Webhook)     | Nein (nur Polling)                  |
| **Historische Nachrichten** | Nein               | Ja (Verlauf kann abgefragt werden)  |
| **Einrichtungsaufwand**  | Nur App-Manifest     | Erfordert Administratorzustimmung + Token-Ablauf |
| **Funktioniert offline** | Nein (muss laufen)   | Ja (jederzeit abfragbar)            |

**Kurz gesagt:** RSC ist für Echtzeit-Listening; die Graph-API ist für historischen Zugriff. Um verpasste Nachrichten nachzuholen, während Sie offline waren, benötigen Sie die Graph-API mit `ChannelMessage.Read.All` (erfordert Administratorzustimmung).

## Graph-aktivierte Medien + Verlauf (für Kanäle erforderlich)

Wenn Sie Bilder/Dateien in **Kanälen** benötigen oder **Nachrichtenverlauf** abrufen möchten, müssen Sie Microsoft-Graph-Berechtigungen aktivieren und Administratorzustimmung erteilen.

1. Fügen Sie in der **App-Registrierung** in Entra ID (Azure AD) Microsoft-Graph-**Anwendungsberechtigungen** hinzu:
   - `ChannelMessage.Read.All` (Kanalanhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteilen Sie Administratorzustimmung** für den Mandanten.
3. Erhöhen Sie die **Manifestversion** der Teams-App, laden Sie sie erneut hoch und **installieren Sie die App in Teams neu**.
4. **Beenden und starten Sie Teams vollständig neu**, um zwischengespeicherte App-Metadaten zu löschen.

**Zusätzliche Berechtigung für Benutzererwähnungen:** Benutzer-@Erwähnungen funktionieren für Benutzer in der Unterhaltung ohne zusätzliche Konfiguration. Wenn Sie jedoch Benutzer dynamisch suchen und erwähnen möchten, die **nicht in der aktuellen Unterhaltung** sind, fügen Sie die Berechtigung `User.Read.All` (Application) hinzu und erteilen Sie Administratorzustimmung.

## Bekannte Einschränkungen

### Webhook-Timeouts

Teams liefert Nachrichten per HTTP-Webhook aus. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), können folgende Probleme auftreten:

- Gateway-Timeouts
- Teams versucht die Nachricht erneut zuzustellen (verursacht Duplikate)
- Verworfene Antworten

OpenClaw handhabt dies, indem es schnell zurückkehrt und Antworten proaktiv sendet, aber sehr langsame Antworten können weiterhin Probleme verursachen.

### Formatierung

Teams-Markdown ist eingeschränkter als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt gerendert
- Adaptive Cards werden für Umfragen und semantische Präsentationssendungen unterstützt (siehe unten)

## Konfiguration

Wichtige Einstellungen (siehe `/gateway/configuration` für gemeinsame Channel-Muster):

- `channels.msteams.enabled`: Channel aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.webhook.port` (Standard `3978`)
- `channels.msteams.webhook.path` (Standard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: Pairing)
- `channels.msteams.allowFrom`: DM-Allowlist (AAD-Objekt-IDs empfohlen). Der Assistent löst Namen während der Einrichtung in IDs auf, wenn Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Break-Glass-Schalter, um veränderliches Matching von UPN/Anzeigenamen und direktes Routing über Team-/Channel-Namen wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Größe ausgehender Textblöcke.
- `channels.msteams.chunkMode`: `length` (Standard) oder `newline`, um vor der Aufteilung nach Länge an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.msteams.mediaAllowHosts`: Allowlist für Hosts eingehender Anhänge (standardmäßig Microsoft-/Teams-Domains).
- `channels.msteams.mediaAuthAllowHosts`: Allowlist für das Anhängen von Authorization-Headern bei Medien-Wiederholungen (standardmäßig Graph- und Bot-Framework-Hosts).
- `channels.msteams.requireMention`: @Mention in Channels/Gruppen erfordern (standardmäßig true).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.requireMention`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.tools`: Standardmäßige Tool-Richtlinienüberschreibungen pro Team (`allow`/`deny`/`alsoAllow`), die verwendet werden, wenn eine Channel-Überschreibung fehlt.
- `channels.msteams.teams.<teamId>.toolsBySender`: Standardmäßige Tool-Richtlinienüberschreibungen pro Team und Sender (`"*"`-Wildcard unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: Überschreibung pro Channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: Überschreibung pro Channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: Tool-Richtlinienüberschreibungen pro Channel (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: Tool-Richtlinienüberschreibungen pro Channel und Sender (`"*"`-Wildcard unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden:
  `id:`, `e164:`, `username:`, `name:` (veraltete Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet).
- `channels.msteams.actions.memberInfo`: Graph-gestützte Aktion für Mitgliederinformationen aktivieren oder deaktivieren (standardmäßig aktiviert, wenn Graph-Anmeldedaten verfügbar sind).
- `channels.msteams.authType`: Authentifizierungstyp - `"secret"` (Standard) oder `"federated"`.
- `channels.msteams.certificatePath`: Pfad zur PEM-Zertifikatdatei (föderierte + zertifikatbasierte Authentifizierung).
- `channels.msteams.certificateThumbprint`: Zertifikatfingerabdruck (optional, für Authentifizierung nicht erforderlich).
- `channels.msteams.useManagedIdentity`: Authentifizierung mit verwalteter Identität aktivieren (föderierter Modus).
- `channels.msteams.managedIdentityClientId`: Client-ID für benutzerzugewiesene verwaltete Identität.
- `channels.msteams.sharePointSiteId`: SharePoint-Website-ID für Datei-Uploads in Gruppenchats/Channels (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)).

## Routing und Sitzungen

- Sitzungsschlüssel folgen dem Standard-Agent-Format (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten teilen sich die Hauptsitzung (`agent:<agentId>:<mainKey>`).
  - Channel-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads vs. Beiträge

Teams hat kürzlich zwei Channel-UI-Stile über demselben zugrunde liegenden Datenmodell eingeführt:

| Stil                     | Beschreibung                                                | Empfohlener `replyStyle` |
| ------------------------ | ----------------------------------------------------------- | ------------------------ |
| **Beiträge** (klassisch) | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard)      |
| **Threads** (Slack-ähnlich) | Nachrichten laufen linear, eher wie Slack                | `top-level`              |

**Das Problem:** Die Teams-API legt nicht offen, welchen UI-Stil ein Channel verwendet. Wenn Sie den falschen `replyStyle` verwenden:

- `thread` in einem Channel im Threads-Stil → Antworten erscheinen ungünstig verschachtelt
- `top-level` in einem Channel im Beitragsstil → Antworten erscheinen als separate Top-Level-Beiträge statt im Thread

**Lösung:** Konfigurieren Sie `replyStyle` pro Channel abhängig davon, wie der Channel eingerichtet ist:

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

### Auflösungsreihenfolge

Wenn der Bot eine Antwort in einen Channel sendet, wird `replyStyle` von der spezifischsten Überschreibung bis zum Standard aufgelöst. Der erste Wert, der nicht `undefined` ist, gewinnt:

1. **Pro Channel** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Pro Team** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Impliziter Standard** — abgeleitet aus `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Wenn Sie `requireMention: false` global ohne explizites `replyStyle` festlegen, werden Mentions in Channels im Beitragsstil als Top-Level-Beiträge angezeigt, selbst wenn der Eingang eine Thread-Antwort war. Setzen Sie `replyStyle: "thread"` auf globaler, Team- oder Channel-Ebene fest, um Überraschungen zu vermeiden.

### Beibehaltung des Thread-Kontexts

Wenn `replyStyle: "thread"` wirksam ist und der Bot aus einem Channel-Thread heraus @mentioned wurde, hängt OpenClaw den ursprünglichen Thread-Stamm wieder an die ausgehende Konversationsreferenz an (`19:…@thread.tacv2;messageid=<root>`), sodass die Antwort im selben Thread landet. Dies gilt sowohl für Live-Sendungen (im Turn) als auch für proaktive Sendungen, die erfolgen, nachdem der Bot-Framework-Turn-Kontext abgelaufen ist (z. B. lang laufende Agenten, in Warteschlangen gestellte Tool-Call-Antworten über `mcp__openclaw__message`).

Der Thread-Stamm wird aus der gespeicherten `threadId` der Konversationsreferenz übernommen. Ältere gespeicherte Referenzen, die vor `threadId` liegen, fallen auf `activityId` zurück (die eingehende Aktivität, die die Konversation zuletzt initialisiert hat), sodass bestehende Bereitstellungen ohne erneutes Initialisieren weiter funktionieren.

Wenn `replyStyle: "top-level"` wirksam ist, werden eingehende Channel-Threads absichtlich als neue Top-Level-Beiträge beantwortet — es wird kein Thread-Suffix angehängt. Dies ist das korrekte Verhalten für Channels im Threads-Stil; wenn Sie Top-Level-Beiträge sehen, wo Sie Thread-Antworten erwartet haben, ist Ihr `replyStyle` für diesen Channel falsch gesetzt.

## Anhänge und Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Dateianhänge funktionieren über die Teams-Bot-Datei-APIs.
- **Channels/Gruppen:** Anhänge liegen im M365-Speicher (SharePoint/OneDrive). Die Webhook-Nutzlast enthält nur einen HTML-Stub, nicht die tatsächlichen Dateibytes. **Graph-API-Berechtigungen sind erforderlich**, um Channel-Anhänge herunterzuladen.
- Für explizite dateizuerst-Sendungen verwenden Sie `action=upload-file` mit `media` / `filePath` / `path`; optionales `message` wird zum begleitenden Text/Kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Channel-Nachrichten mit Bildern nur als Text empfangen (der Bildinhalt ist für den Bot nicht zugänglich).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um jeden Host zu erlauben).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- und Bot-Framework-Hosts). Halten Sie diese Liste strikt (vermeiden Sie mandantenübergreifende Suffixe).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs mit dem FileConsentCard-Ablauf senden (integriert). **Das Senden von Dateien in Gruppenchats/Channels** erfordert jedoch zusätzliche Einrichtung:

| Kontext                  | Wie Dateien gesendet werden                    | Erforderliche Einrichtung                         |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------- |
| **DMs**                  | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                         |
| **Gruppenchats/Channels** | Upload zu SharePoint → Link teilen            | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Base64-codiert inline                         | Funktioniert sofort                               |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der Graph-API-Endpunkt `/me/drive` funktioniert nicht für Anwendungsidentitäten). Um Dateien in Gruppenchats/Channels zu senden, lädt der Bot sie auf eine **SharePoint-Website** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Graph-API-Berechtigungen hinzufügen** in Entra ID (Azure AD) → App-Registrierung:
   - `Sites.ReadWrite.All` (Application) - Dateien zu SharePoint hochladen
   - `Chat.Read.All` (Application) - optional, aktiviert Freigabelinks pro Benutzer

2. **Administratoreinwilligung** für den Mandanten erteilen.

3. **Ihre SharePoint-Website-ID abrufen:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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
| Nur `Sites.ReadWrite.All`               | Organisationsweiter Freigabelink (jeder in der Organisation kann zugreifen) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Freigabelink pro Benutzer (nur Chatmitglieder können zugreifen) |

Freigabe pro Benutzer ist sicherer, da nur die Chatteilnehmer auf die Datei zugreifen können. Wenn die Berechtigung `Chat.Read.All` fehlt, fällt der Bot auf organisationsweite Freigabe zurück.

### Fallback-Verhalten

| Szenario                                           | Ergebnis                                           |
| -------------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + `sharePointSiteId` konfiguriert | Upload zu SharePoint, Freigabelink senden       |
| Gruppenchat + Datei + kein `sharePointSiteId`      | OneDrive-Upload versuchen (kann fehlschlagen), nur Text senden |
| Persönlicher Chat + Datei                          | FileConsentCard-Ablauf (funktioniert ohne SharePoint) |
| Jeder Kontext + Bild                               | Base64-codiert inline (funktioniert ohne SharePoint) |

### Speicherort der Dateien

Hochgeladene Dateien werden in einem Ordner `/OpenClawShared/` in der Standarddokumentbibliothek der konfigurierten SharePoint-Website gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-Umfrage-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` erfasst.
- Das Gateway muss online bleiben, um Stimmen zu erfassen.
- Umfragen veröffentlichen noch keine automatischen Ergebniszusammenfassungen (prüfen Sie bei Bedarf die Speicherdatei).

## Präsentationskarten

Senden Sie semantische Präsentations-Payloads mit dem `message`-Tool oder der CLI an Teams-Benutzer oder Unterhaltungen. OpenClaw rendert sie aus dem generischen Präsentationsvertrag als Teams Adaptive Cards.

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

Details zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Unterhaltungen zu unterscheiden:

| Zieltyp             | Format                           | Beispiel                                            |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Benutzer (nach ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Benutzer (nach Name) | `user:<display-name>`           | `user:John Smith` (erfordert Graph API)             |
| Gruppe/Kanal        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppe/Kanal (roh)  | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

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

**Beispiele für das Agent-Tool:**

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
Ohne das Präfix `user:` werden Namen standardmäßig als Gruppe oder Team aufgelöst. Verwenden Sie immer `user:`, wenn Sie Personen anhand ihres Anzeigenamens adressieren.
</Note>

## Proaktives Messaging

- Proaktive Nachrichten sind nur **nachdem** ein Benutzer interagiert hat möglich, da wir zu diesem Zeitpunkt Unterhaltungsreferenzen speichern.
- Siehe `/gateway/configuration` für `dmPolicy` und Allowlist-Gating.

## Team- und Kanal-IDs (häufige Stolperfalle)

Der Abfrageparameter `groupId` in Teams-URLs ist **NICHT** die Team-ID, die für die Konfiguration verwendet wird. Extrahieren Sie IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Kanal-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Für die Konfiguration:**

- Team-Schlüssel = Pfadsegment nach `/team/` (URL-dekodiert, z. B. `19:Bk4j...@thread.tacv2`; ältere Tenants können `@thread.skype` anzeigen, was ebenfalls gültig ist)
- Kanal-Schlüssel = Pfadsegment nach `/channel/` (URL-dekodiert)
- **Ignorieren Sie** den Abfrageparameter `groupId` für das OpenClaw-Routing. Er ist die Microsoft Entra-Gruppen-ID, nicht die Bot Framework-Unterhaltungs-ID, die in eingehenden Teams-Aktivitäten verwendet wird.

## Private Kanäle

Bots haben in privaten Kanälen eingeschränkte Unterstützung:

| Funktion                     | Standardkanäle | Private Kanäle              |
| ---------------------------- | -------------- | --------------------------- |
| Bot-Installation             | Ja             | Eingeschränkt               |
| Echtzeitnachrichten (Webhook) | Ja            | Funktioniert möglicherweise nicht |
| RSC-Berechtigungen           | Ja             | Können sich anders verhalten |
| @mentions                    | Ja             | Wenn der Bot zugänglich ist |
| Graph API-Verlauf            | Ja             | Ja (mit Berechtigungen)     |

**Umgehungen, wenn private Kanäle nicht funktionieren:**

1. Verwenden Sie Standardkanäle für Bot-Interaktionen
2. Verwenden Sie DMs - Benutzer können dem Bot immer direkt Nachrichten senden
3. Verwenden Sie Graph API für historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installieren Sie die Teams-App erneut und beenden/öffnen Sie Teams vollständig neu.
- **Keine Antworten im Kanal:** Erwähnungen sind standardmäßig erforderlich; setzen Sie `channels.msteams.requireMention=false` oder konfigurieren Sie dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt weiterhin altes Manifest):** Entfernen Sie die App, fügen Sie sie erneut hinzu und beenden Sie Teams vollständig, um zu aktualisieren.
- **401 Unauthorized vom Webhook:** Erwartet, wenn manuell ohne Azure-JWT getestet wird - bedeutet, dass der Endpunkt erreichbar ist, aber die Authentifizierung fehlgeschlagen ist. Verwenden Sie Azure Web Chat, um korrekt zu testen.

### Fehler beim Manifest-Upload

- **"Icon file cannot be empty":** Das Manifest verweist auf Symboldateien mit 0 Bytes. Erstellen Sie gültige PNG-Symbole (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Suchen und deinstallieren Sie sie zuerst oder warten Sie 5-10 Minuten auf die Weitergabe.
- **"Something went wrong" beim Upload:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die Browser-DevTools (F12) → Registerkarte „Network“ und prüfen Sie den Antworttext auf den eigentlichen Fehler.
- **Sideload schlägt fehl:** Versuchen Sie „Upload an app to your org's app catalog“ statt „Upload a custom app“ - dadurch werden Sideload-Einschränkungen oft umgangen.

### RSC-Berechtigungen funktionieren nicht

1. Prüfen Sie, ob `webApplicationInfo.id` exakt mit der App-ID Ihres Bots übereinstimmt
2. Laden Sie die App erneut hoch und installieren Sie sie im Team/Chat erneut
3. Prüfen Sie, ob Ihr Organisationsadministrator RSC-Berechtigungen blockiert hat
4. Bestätigen Sie, dass Sie den richtigen Scope verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Einrichtungsanleitung für Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams-App-Manifestschema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanalnachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC-Berechtigungsreferenz](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Dateiverarbeitung für Teams-Bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proaktives Messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI für Bot-Verwaltung

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
