---
read_when:
    - Standardeinstellungen für den erhöhten Modus, Allowlists oder das Verhalten von Slash-Befehlen anpassen
    - Verstehen, wie Agenten in einer Sandbox auf den Host zugreifen können
summary: 'Exec-Modus mit erhöhten Rechten: Befehle von einem sandboxierten Agenten aus außerhalb der Sandbox ausführen'
title: Modus mit erhöhten Rechten
x-i18n:
    generated_at: "2026-05-06T07:05:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Wenn ein Agent innerhalb einer Sandbox ausgeführt wird, sind seine `exec`-Befehle auf die
Sandbox-Umgebung beschränkt. **Elevated mode** lässt den Agent stattdessen ausbrechen und Befehle
außerhalb der Sandbox ausführen, mit konfigurierbaren Genehmigungs-Gates.

<Info>
  Elevated mode ändert das Verhalten nur, wenn der Agent **sandboxed** ist. Bei
  nicht sandboxed Agents läuft exec bereits auf dem Host.
</Info>

## Direktiven

Steuern Sie Elevated mode pro Sitzung mit Slash-Befehlen:

| Direktive        | Funktion                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Außerhalb der Sandbox auf dem konfigurierten Host-Pfad ausführen, Genehmigungen beibehalten |
| `/elevated ask`  | Wie `on` (Alias)                                                       |
| `/elevated full` | Außerhalb der Sandbox auf dem konfigurierten Host-Pfad ausführen und Genehmigungen überspringen |
| `/elevated off`  | Zur auf die Sandbox beschränkten Ausführung zurückkehren               |

Auch verfügbar als `/elev on|off|ask|full`.

Senden Sie `/elevated` ohne Argument, um die aktuelle Ebene anzuzeigen.

## Funktionsweise

<Steps>
  <Step title="Verfügbarkeit prüfen">
    Elevated muss in der Konfiguration aktiviert sein und der Absender muss auf der Allowlist stehen:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Ebene festlegen">
    Senden Sie eine Nachricht, die nur aus einer Direktive besteht, um den Sitzungsstandard festzulegen:

    ```
    /elevated full
    ```

    Oder verwenden Sie sie inline (gilt nur für diese Nachricht):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Befehle außerhalb der Sandbox ausführen">
    Wenn Elevated aktiv ist, verlassen `exec`-Aufrufe die Sandbox. Der effektive Host ist
    standardmäßig `gateway` oder `node`, wenn das konfigurierte bzw. Sitzungs-Exec-Ziel
    `node` ist. Im Modus `full` werden exec-Genehmigungen übersprungen. Im Modus `on`/`ask`
    gelten konfigurierte Genehmigungsregeln weiterhin.
  </Step>
</Steps>

## Auflösungsreihenfolge

1. **Inline-Direktive** in der Nachricht (gilt nur für diese Nachricht)
2. **Sitzungs-Override** (festgelegt durch Senden einer Nachricht, die nur aus einer Direktive besteht)
3. **Globaler Standard** (`agents.defaults.elevatedDefault` in der Konfiguration)

## Verfügbarkeit und Allowlists

- **Globales Gate**: `tools.elevated.enabled` (muss `true` sein)
- **Absender-Allowlist**: `tools.elevated.allowFrom` mit Listen pro Kanal
- **Gate pro Agent**: `agents.list[].tools.elevated.enabled` (kann nur weiter einschränken)
- **Allowlist pro Agent**: `agents.list[].tools.elevated.allowFrom` (Absender muss sowohl global als auch pro Agent übereinstimmen)
- **Discord-Fallback**: Wenn `tools.elevated.allowFrom.discord` ausgelassen wird, wird `channels.discord.allowFrom` als Fallback verwendet
- **Alle Gates müssen bestehen**; andernfalls wird Elevated als nicht verfügbar behandelt

Formate für Allowlist-Einträge:

| Präfix                  | Übereinstimmung                |
| ----------------------- | ------------------------------ |
| (keines)                | Absender-ID, E.164 oder From-Feld |
| `name:`                 | Anzeigename des Absenders      |
| `username:`             | Benutzername des Absenders     |
| `tag:`                  | Tag des Absenders              |
| `id:`, `from:`, `e164:` | Explizites Identity-Targeting  |

## Was Elevated nicht steuert

- **Tool-Policy**: Wenn `exec` durch die Tool-Policy verweigert wird, kann Elevated das nicht überschreiben.
- **Host-Auswahlrichtlinie**: Elevated macht aus `auto` keinen freien Cross-Host-Override. Es verwendet die konfigurierten bzw. Sitzungsregeln für das Exec-Ziel und wählt `node` nur dann, wenn das Ziel bereits `node` ist.
- **Getrennt von `/exec`**: Die Direktive `/exec` passt Exec-Standards pro Sitzung für autorisierte Absender an und erfordert keinen Elevated mode.

<Note>
  Der Bash-Chatbefehl (`!`-Präfix; `/bash`-Alias) ist ein separates Gate, für das zusätzlich zu seinem eigenen Flag `tools.bash.enabled` auch `tools.elevated` aktiviert sein muss. Das Deaktivieren von Elevated sperrt auch `!`-Shell-Befehle aus.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Shell-Befehlsausführung vom Agent aus.
  </Card>
  <Card title="Exec-Genehmigungen" href="/de/tools/exec-approvals" icon="shield">
    Genehmigungs- und Allowlist-System für `exec`.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Konfiguration auf Gateway-Ebene.
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Wie die drei Gates während eines Tool-Aufrufs zusammenspielen.
  </Card>
</CardGroup>
