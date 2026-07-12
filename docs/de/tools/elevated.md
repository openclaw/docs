---
read_when:
    - Standardwerte für den erhöhten Modus, Zulassungslisten oder das Verhalten von Slash-Befehlen anpassen
    - Verstehen, wie Agents in der Sandbox auf den Host zugreifen können
summary: 'Erweiterter Ausführungsmodus: Befehle von einem sandboxgeschützten Agenten außerhalb der Sandbox ausführen'
title: Erweiterter Modus
x-i18n:
    generated_at: "2026-07-12T15:56:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Wenn ein Agent innerhalb einer Sandbox ausgeführt wird, sind seine `exec`-Befehle auf die Sandbox-Umgebung beschränkt. Der **erweiterte Modus** ermöglicht es dem Agenten, diese Beschränkung zu umgehen und stattdessen Befehle außerhalb der Sandbox auszuführen, mit konfigurierbaren Genehmigungsschranken.

<Info>
  Der erweiterte Modus ändert das Verhalten nur, wenn der Agent in einer **Sandbox** ausgeführt wird. Bei Agenten ohne Sandbox wird exec bereits auf dem Host ausgeführt.
</Info>

## Direktiven

Steuern Sie den erweiterten Modus sitzungsbezogen mit Slash-Befehlen:

| Direktive        | Funktion                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Außerhalb der Sandbox im konfigurierten Host-Pfad ausführen und Genehmigungen beibehalten                                                       |
| `/elevated ask`  | Identisch mit `on` (Alias)                                                                                                                       |
| `/elevated full` | Außerhalb der Sandbox im konfigurierten Host-Pfad ausführen und Genehmigungen überspringen, wenn die Modus-/Host-Genehmigungsrichtlinie bereits freizügig ist |
| `/elevated off`  | Zur auf die Sandbox beschränkten Ausführung zurückkehren                                                                                         |

Auch als `/elev on|off|ask|full` verfügbar.

Senden Sie `/elevated` ohne Argument, um die aktuelle Stufe anzuzeigen.

## Funktionsweise

<Steps>
  <Step title="Verfügbarkeit prüfen">
    Der erweiterte Modus muss in der Konfiguration aktiviert sein und der Absender muss auf der Zulassungsliste stehen:

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

  <Step title="Stufe festlegen">
    Senden Sie eine Nachricht, die ausschließlich die Direktive enthält, um den Sitzungsstandard festzulegen:

    ```
    /elevated full
    ```

    Oder verwenden Sie sie inline (gilt nur für diese Nachricht):

    ```
    /elevated on Bereitstellungsskript ausführen
    ```

  </Step>

  <Step title="Befehle außerhalb der Sandbox ausführen">
    Wenn der erweiterte Modus aktiv ist, verlassen `exec`-Aufrufe die Sandbox. Der wirksame Host ist
    standardmäßig `gateway` oder `node`, wenn das konfigurierte bzw. sitzungsbezogene exec-Ziel
    `node` ist. Im Modus `full` werden exec-Genehmigungen übersprungen, wenn die aufgelöste
    Genehmigungsrichtlinie für exec-Modus und -Host bereits vollständig freizügig ist (Sicherheit `full`,
    Abfrage `off`); andernfalls gilt weiterhin die normale Genehmigungsrichtlinie. Im Modus
    `on`/`ask` gelten die konfigurierten Genehmigungsregeln immer.
  </Step>
</Steps>

## Auflösungsreihenfolge

1. **Inline-Direktive** in der Nachricht (gilt nur für diese Nachricht)
2. **Sitzungsüberschreibung** (durch Senden einer Nachricht, die ausschließlich die Direktive enthält)
3. **Globaler Standard** (`agents.defaults.elevatedDefault` in der Konfiguration)

## Verfügbarkeit und Zulassungslisten

- **Globale Schranke**: `tools.elevated.enabled` (muss `true` sein)
- **Absender-Zulassungsliste**: `tools.elevated.allowFrom` mit kanalspezifischen Listen
- **Agentenspezifische Schranke**: `agents.list[].tools.elevated.enabled` (kann nur weiter einschränken; sowohl die globale als auch die agentenspezifische Schranke müssen `true` sein)
- **Agentenspezifische Zulassungsliste**: `agents.list[].tools.elevated.allowFrom` (der Absender muss sowohl mit der globalen als auch mit der agentenspezifischen Liste übereinstimmen)
- **Vom Kanal bereitgestellte Fallback-Zulassungsliste**: Kanal-Plugins können über einen SDK-Adapter-Hook optional eine Fallback-Zulassungsliste bereitstellen, die verwendet wird, wenn `tools.elevated.allowFrom.<provider>` nicht konfiguriert ist. Derzeit implementiert kein gebündeltes Kanal-Plugin diesen Hook, sodass heute in der Praxis jeder Provider einen expliziten Eintrag unter `tools.elevated.allowFrom.<provider>` benötigt.
- **Alle Schranken müssen passiert werden**; andernfalls gilt der erweiterte Modus als nicht verfügbar

Formate für Einträge in der Zulassungsliste:

| Präfix                  | Entspricht                             |
| ----------------------- | -------------------------------------- |
| (keines)                | Absender-ID, E.164 oder From-Feld      |
| `name:`                 | Anzeigename des Absenders              |
| `username:`             | Benutzername des Absenders             |
| `tag:`                  | Tag des Absenders                      |
| `id:`, `from:`, `e164:` | Explizite Adressierung einer Identität |

## Was der erweiterte Modus nicht steuert

- **Tool-Richtlinie**: Wenn `exec` durch die Tool-Richtlinie verweigert wird, kann der erweiterte Modus dies nicht außer Kraft setzen.
- **Host-Auswahlrichtlinie**: Der erweiterte Modus verwandelt `auto` nicht in eine uneingeschränkte hostübergreifende Überschreibung. Er verwendet die konfigurierten bzw. sitzungsbezogenen Regeln für das exec-Ziel und wählt `node` nur aus, wenn das Ziel bereits `node` ist.
- **Unabhängig von `/exec`**: Die Direktive `/exec` passt für autorisierte Absender die sitzungsbezogenen exec-Standards (Host, Sicherheit, Abfrage, Node) an und erfordert nicht den erweiterten Modus.

<Note>
  Der Bash-Chatbefehl (Präfix `!`; Alias `/bash`) verfügt über eine separate Schranke, die zusätzlich zu seinem eigenen Flag `tools.bash.enabled` die Aktivierung von `tools.elevated` voraussetzt. Wenn der erweiterte Modus deaktiviert wird, werden auch `!`-Shell-Befehle gesperrt.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Ausführung von Shell-Befehlen durch den Agenten.
  </Card>
  <Card title="Exec-Genehmigungen" href="/de/tools/exec-approvals" icon="shield">
    Genehmigungs- und Zulassungssystem für `exec`.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Konfiguration auf Gateway-Ebene.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. erweiterter Modus" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Wie die drei Schranken bei einem Tool-Aufruf zusammenwirken.
  </Card>
</CardGroup>
