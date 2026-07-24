---
read_when:
    - Discord-Activity-Widgets einrichten oder Fehler beheben
summary: Eigenständige OpenClaw-HTML-Widgets in Discord Activities starten
title: Discord-Aktivitäten
x-i18n:
    generated_at: "2026-07-24T04:14:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b1bc04443aef89fd514290c3bebdbdd3e9972298b45cae3806bec99344f6d8cd
    source_path: channels/discord-activities.md
    workflow: 16
---

Discord Activities ermöglichen es einem Agenten, ein interaktives, eigenständiges HTML-Widget im aktuellen Discord-Kanal zu posten. Die Nachricht enthält eine Schaltfläche **Widget öffnen**; durch Anklicken wird das Widget innerhalb von Discord gestartet.

Die Funktion ist standardmäßig deaktiviert. OpenClaw registriert die Activity-HTTP-Routen, das Agenten-Tool `show_widget` und den Handler für die Startschaltfläche nur, wenn `channels.discord.activities` vorhanden ist und ein Client-Secret aufgelöst werden kann. Der veraltete Alias `discord_widget` bleibt für eine Version verfügbar.

## Voraussetzungen

- ein vorhandener [OpenClaw-Discord-Bot](/de/channels/discord)
- ein öffentlicher HTTPS-Hostname, über den das OpenClaw-Gateway erreichbar ist
- die Berechtigung, Activities und OAuth2 für die Discord-Anwendung des Bots zu konfigurieren

Jeder HTTPS-Reverse-Proxy oder Tunnel ist geeignet. Ein benannter Cloudflare Tunnel stellt einen stabilen Hostnamen bereit, ohne den Gateway-Port direkt offenzulegen.

```yaml
# ~/.cloudflared/config.yml
tunnel: openclaw-discord
credentials-file: /home/you/.cloudflared/TUNNEL-ID.json
ingress:
  - hostname: openclaw.example.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

```bash
cloudflared tunnel login
cloudflared tunnel create openclaw-discord
cloudflared tunnel route dns openclaw-discord openclaw.example.com
cloudflared tunnel run openclaw-discord
```

Lassen Sie die normale Gateway-Authentifizierung aktiviert. Nur das Activity-Präfix ist öffentlich, und das Plugin validiert OAuth, die Zugehörigkeit zur Activity-Instanz, die Kanalbindung, Sitzungen und einmalig verwendbare Dokumentberechtigungen selbst.

## Einrichtung

<Steps>
  <Step title="Gateway über HTTPS verfügbar machen">
    Starten Sie Ihren Tunnel oder Reverse-Proxy und überprüfen Sie nach dem Hinzufügen der Activities-Konfiguration, ob `https://openclaw.example.com/discord/activity/` das Gateway erreicht. Ersetzen Sie den Beispiel-Hostnamen durch Ihren eigenen.
  </Step>

  <Step title="Activities in Discord aktivieren">
    Öffnen Sie die vorhandene Bot-Anwendung im [Discord Developer Portal](https://discord.com/developers/applications). Öffnen Sie **Activities**, aktivieren Sie Activities und erstellen Sie eine URL-Zuordnung:

    - Präfix: `ROOT` (`/`)
    - Ziel: `openclaw.example.com/discord/activity`

    Das Ziel besteht aus dem öffentlichen Hostnamen und `/discord/activity`, ohne abschließenden Schrägstrich.

  </Step>

  <Step title="OAuth2-Client-Secret kopieren">
    Öffnen Sie **OAuth2** im Developer Portal. Discord erfordert mindestens einen Redirect-URI. Fügen Sie daher einen lokalen Platzhalter wie die Loopback-Adresse hinzu, falls die Anwendung noch keinen besitzt; das Embedded App SDK übernimmt den Activity-Rückleitungsablauf. Kopieren Sie das Client-Secret der Anwendung oder setzen Sie es zurück. Behandeln Sie es wie Anmeldedaten: Fügen Sie es nicht in Chats, Protokolle oder eine eingecheckte Konfigurationsdatei ein.
  </Step>

  <Step title="OpenClaw konfigurieren">
    Fügen Sie dem Discord-Konto, das Widgets anbieten soll, einen Block hinzu:

    ```json5
    {
      channels: {
        discord: {
          token: "${DISCORD_BOT_TOKEN}",
          activities: {
            clientSecret: "${DISCORD_CLIENT_SECRET}",
            // Optional. Verwendet standardmäßig die beim Start ermittelte Bot-Anwendungs-ID.
            applicationId: "YOUR_DISCORD_APPLICATION_ID",
          },
        },
      },
    }
    ```

    Sie können `clientSecret` aus dem Block weglassen, wenn `DISCORD_CLIENT_SECRET` gesetzt ist. Der Block selbst muss vorhanden bleiben, um die Funktion zu aktivieren.

    Die normalen Discord-Zugriffseinstellungen bleiben davon getrennt. Beispielsweise steuert `allowFrom` weiterhin, wer dem Agenten Direktnachrichten senden kann; diese Einstellung steuert nicht, wer ein bereits in einem Kanal gepostetes Widget öffnen kann.

  </Step>

  <Step title="Neu starten und testen">
    Starten Sie das Gateway neu. Bitten Sie den Agenten in einer Discord-Unterhaltung, ein interaktives Widget anzuzeigen. Der Agent ruft `show_widget` auf; klicken Sie in der geposteten Nachricht auf **Widget öffnen**.
  </Step>
</Steps>

## Sicherheitsmodell

- OAuth identifiziert den Discord-Benutzer, bevor Widget-Metadaten zurückgegeben werden.
- Die Get Activity Instance API von Discord muss bestätigen, dass der OAuth-Benutzer in der aktuellen Activity-Instanz anwesend ist. Der Kanal der Instanz muss mit dem Kanal übereinstimmen, in dem das Widget gepostet wurde.
- Jeder, dem Discord den Zugriff auf diesen Kanal erlaubt, kann dessen Widgets öffnen. Verwenden Sie Discord-Kanalberechtigungen, um den Benutzerkreis einzuschränken. OpenClaw-Befehls- und Direktnachrichten-Zulassungslisten gewähren oder entziehen keinen Zugriff auf bereits gepostete Kanalinhalte.
- OAuth-Sitzungen laufen nach 15 Minuten ab. Widget-Dokumentberechtigungen laufen nach 60 Sekunden ab und können einmal verwendet werden.
- Widgets laufen nach sieben Tagen ab; pro Discord-Plugin-Instanz werden höchstens 64 aufbewahrt.
- Das Widget-HTML wird von Ihrem Agenten erstellt und sollte als vertrauenswürdiger Inhalt behandelt werden. Betten Sie keine Geheimnisse ein, die ein fehlerhaftes Widget nicht offenlegen soll.
- Das Widget kann innerhalb seines eigenen verschachtelten Frames navigieren. Der `sandbox="allow-scripts"`-iframe blockiert die Navigation auf oberster Ebene, Pop-ups und Same-Origin-Zugriff, während seine Content Security Policy Netzwerkverbindungen und externe Ressourcen blockiert. Diese Kontrollen dienen der mehrschichtigen Absicherung und stellen keine Sicherheitsgrenze gegenüber dem Agenten dar, der das Widget erstellt hat.
- Wenn Activities deaktiviert ist, wird `/discord/activity` überhaupt nicht registriert.

Die öffentliche Activity-Shell und die Route für den Token-Austausch werden bei aktivierter Funktion über Ihren Tunnel erreichbar. Ohne eine gültige OAuth-Sitzung und eine einmalig verwendbare Dokumentberechtigung geben sie das Widget-HTML nicht preis.

## Fehlerbehebung

### Die Activity meldet „Gateway offline“

- Bestätigen Sie, dass der Tunnel läuft und Anfragen an den tatsächlichen Bind-Port des Gateways weiterleitet
- Bestätigen Sie, dass das Ziel im Developer Portal `/discord/activity` enthält
- Starten Sie das Gateway nach Änderungen an der Discord- oder OpenClaw-Konfiguration neu
- Prüfen Sie die Gateway-Protokolle auf die einzeilige Warnung über ein fehlendes Activities-Client-Secret

### Discord öffnet eine leere Seite oder meldet `blocked:csp`

- Überprüfen Sie, ob die URL-Zuordnung `ROOT` verwendet und kein zweites `/discord/activity`-Segment hinzufügt
- Bestätigen Sie, dass die Shell, `shell.js` und das SDK-Modul vollständig über den Discord-Proxy zurückgegeben werden
- Prüfen Sie die Gateway-Protokolle auf Anfragen unter `/discord/activity/`

Netzwerkanfragen von Widgets werden absichtlich blockiert. Betten Sie sämtliches CSS, JavaScript, alle Bilder und Daten, die das Widget benötigt, direkt ein.

### „Widget nicht verfügbar“

Betätigen Sie die Startschaltfläche in dem Kanal, in dem der Agent sie gepostet hat. OpenClaw erfasst Starts serverseitig, wenn die Schaltfläche angeklickt wird. Dadurch kann ein neuer Starteintrag das genaue Widget auflösen, selbst wenn Discord die benutzerdefinierte ID der Schaltfläche weglässt oder beschädigt. Wenn weder die benutzerdefinierte ID noch ein Starteintrag aufgelöst werden kann, öffnet OpenClaw das zuletzt gepostete, noch aktive Widget in diesem Kanal. Ältere Widgets bleiben über Schaltflächen erreichbar, die ihre benutzerdefinierte ID beibehalten.

### „Sie können Activities in diesem Kanal nicht starten“

Discord startet Activities nicht aus Threads von Forumsbeiträgen. OpenClaw kann die Widget-Nachricht und die Schaltfläche dort posten, die Activity muss jedoch stattdessen aus einem regulären Textkanal gestartet werden. Diese Einschränkung stammt von Discord, nicht von OpenClaw.
