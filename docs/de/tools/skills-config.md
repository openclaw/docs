---
read_when:
    - Lade-, Installations- oder Zugriffssteuerungsverhalten für Skills konfigurieren
    - Sichtbarkeit von Skills pro Agent festlegen
    - Limits oder Genehmigungsrichtlinie des Skill Workshops anpassen
sidebarTitle: Skills config
summary: Vollständige Referenz für das Konfigurationsschema `skills.*`, Agent-Allowlists, Workshop-Einstellungen und die Verarbeitung von Sandbox-Umgebungsvariablen.
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-07-24T04:13:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bc154bdf8a8537095a4d39bc6e86ebfd716e6beacd45def9c8a1c15fcdc93698
    source_path: tools/skills-config.md
    workflow: 16
---

Die meiste Skills-Konfiguration befindet sich unter `skills` in
`~/.openclaw/openclaw.json`. Die agentenspezifische Sichtbarkeit befindet sich unter
`agents.defaults.skills` und `agents.entries.*.skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Verwenden Sie für die integrierte Bilderzeugung `agents.defaults.mediaModels.image`
  zusammen mit dem zentralen Tool `image_generate` anstelle von `skills.entries`. Skill-
  Einträge sind ausschließlich für benutzerdefinierte oder Drittanbieter-Skill-Workflows vorgesehen.
</Note>

## Laden (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Zusätzliche zu durchsuchende Skill-Verzeichnisse mit der niedrigsten Priorität (unterhalb
  gebündelter und Plugin-Skills). Pfade werden mit Unterstützung für `~` erweitert.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Vertrauenswürdige tatsächliche Zielverzeichnisse, in die über symbolische Links eingebundene
  Skill-Ordner aufgelöst werden dürfen, selbst wenn sich der symbolische Link außerhalb des
  konfigurierten Stammverzeichnisses befindet. Verwenden Sie dies für beabsichtigte Layouts
  mit benachbarten Repositorys wie `<workspace>/skills/manager -> ~/Projects/manager/skills`. Halten Sie diese Liste
  eng gefasst – verweisen Sie nicht auf weitreichende Stammverzeichnisse wie
  `~` oder `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Überwacht Skill-Ordner und aktualisiert den Skills-Snapshot, wenn sich
  `SKILL.md`-Dateien ändern. Dies umfasst verschachtelte Dateien unter gruppierten
  Skill-Stammverzeichnissen.
</ParamField>

## Installation (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Bevorzugt Homebrew-Installationsprogramme, wenn `brew` verfügbar ist.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Bevorzugter Node-Paketmanager für Skill-Installationen. Dies betrifft nur
  Skill-Installationen – die OpenClaw-CLI und die Gateway-Laufzeit benötigen Node, da
  der kanonische Zustandsspeicher `node:sqlite` verwendet. `openclaw setup --node-manager` und
  `openclaw onboard --node-manager` akzeptieren `npm`, `pnpm` oder
  `bun`; legen Sie `"yarn"` für Yarn-basierte Skill-Installationen
  direkt in der Konfiguration fest.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Erlaubt vertrauenswürdigen `operator.admin`-Gateway-Clients, private ZIP-
  Archive zu installieren, die über `skills.upload.*` bereitgestellt wurden. Normale
  ClawHub-Installationen benötigen diese Einstellung nicht.
</ParamField>

## Installationsrichtlinie für Betreiber (`security.installPolicy`)

Verwenden Sie `security.installPolicy`, wenn Betreiber einen vertrauenswürdigen lokalen Befehl
benötigen, um Skill- und Plugin-Installationen anhand hostspezifischer Richtlinien zu
genehmigen oder zu blockieren. Die Richtlinie wird ausgeführt, nachdem OpenClaw das
Quellmaterial bereitgestellt hat und bevor die Installation oder Aktualisierung fortgesetzt
wird. Sie gilt für ClawHub-Skills, hochgeladene Skills, Git-/lokale Skills,
Installationsprogramme für Skill-Abhängigkeiten sowie Quellen für Plugin-Installationen
und -Aktualisierungen.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Ziele weglassen, um alle unterstützten Ziele abzudecken.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Aktiviert die betreibereigene Installationsrichtlinie. Wenn sie ohne einen gültigen
  `exec`-Befehl aktiviert ist, schlagen Installationen nach dem
  Fail-Closed-Prinzip fehl.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Optionaler Zielfilter. Wenn er weggelassen wird, gilt die Richtlinie für jedes
  unterstützte Ziel, damit neue Installationen nicht unerwartet nach dem
  Fail-Open-Prinzip zugelassen werden.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Absoluter Pfad zur vertrauenswürdigen ausführbaren Richtliniendatei. OpenClaw führt
  sie ohne Shell aus und validiert den Pfad vor der Verwendung.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statische Argumente, die nach `command` übergeben werden.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maximale Gesamtlaufzeit für eine Richtlinienentscheidung.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maximale Zeit ohne Ausgabe auf stdout oder stderr, bevor die Richtlinie nach dem
  Fail-Closed-Prinzip fehlschlägt.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maximale kombinierte Anzahl an stdout- und stderr-Bytes, die vom Richtlinienprozess
  akzeptiert wird.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Literale Umgebungsvariablen, die dem Richtlinienprozess bereitgestellt werden.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Namen von Umgebungsvariablen, die aus dem OpenClaw-Prozess in den Richtlinienprozess
  kopiert werden. Nur ausdrücklich benannte Variablen werden übergeben.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Optionale Positivliste der Verzeichnisse, die die ausführbare Richtliniendatei
  enthalten dürfen.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Umgeht die Prüfungen der Eigentümerschaft und Berechtigungen des Befehlspfads.
  Verwenden Sie dies nur, wenn der Pfad durch einen anderen Mechanismus geschützt ist.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Erlaubt, dass der konfigurierte Befehlspfad ein symbolischer Link ist. Das aufgelöste
  Ziel muss weiterhin die anderen Pfadprüfungen erfüllen. Skriptargumente für Interpreter
  müssen direkte reguläre Dateien und dürfen keine symbolischen Links sein.
</ParamField>

Die Richtlinie empfängt auf stdin ein JSON-Objekt mit `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`,
`sourcePathKind`, optionalem strukturiertem `source`, strukturiertem
`origin` und `request`. Sie muss ein JSON-Objekt auf stdout
schreiben: `{ "protocolVersion": 1, "decision": "allow" }` oder `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ein Exit-Code ungleich null,
eine Zeitüberschreitung, fehlerhaftes JSON, fehlende Felder oder nicht unterstützte
Protokollversionen führen nach dem Fail-Closed-Prinzip zum Fehlschlag.

OpenClaw führt die Installationsrichtlinie beim normalen Start des Gateways nicht aus.
Installationen und Aktualisierungen schlagen nach dem Fail-Closed-Prinzip fehl, wenn die
Richtlinie aktiviert, aber nicht verfügbar ist. `openclaw doctor` führt eine statische
Validierung durch; `openclaw doctor --deep` führt eine synthetische Installationsprüfung mit
dem konfigurierten Befehl aus.

Bei Massenaktualisierungen wird die Richtlinie auf jedes Ziel einzeln angewendet: Eine
blockierte Skill- oder Plugin-Aktualisierung schlägt für dieses Ziel fehl, ohne die
Richtlinie zu deaktivieren oder spätere Ziele im Stapel zu überspringen.

Beispiel für stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Minimaler Richtlinienbefehl:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "Lokale Plugin-Pfade sind auf diesem Host nicht genehmigt",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Positivliste gebündelter Skills

<ParamField path="skills.allowBundled" type="string[]">
  Optionale Positivliste ausschließlich für **gebündelte** Skills. Wenn sie festgelegt
  ist, kommen nur die gebündelten Skills in der Liste infrage. Verwaltete,
  agentenspezifische und Workspace-Skills sind davon nicht betroffen.
</ParamField>

## Skill-spezifische Einträge (`skills.entries`)

Schlüssel unter `entries` entsprechen standardmäßig der Skill-
`name`. Wenn ein Skill `metadata.openclaw.skillKey` definiert, verwenden Sie
stattdessen diesen Schlüssel. Setzen Sie Namen mit Bindestrichen in Anführungszeichen
(JSON5 erlaubt Schlüssel in Anführungszeichen).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` deaktiviert den Skill, selbst wenn er gebündelt oder installiert
  ist. Der gebündelte Skill `coding-agent` muss explizit aktiviert werden – setzen
  Sie ihn auf `true` und stellen Sie sicher, dass `claude`,
  `codex`, `opencode` oder eine andere unterstützte CLI installiert
  und authentifiziert ist.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder eine SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Umgebungsvariablen, die für den Agentenlauf injiziert werden. Sie werden nur
  injiziert, wenn die Variable im Prozess noch nicht gesetzt ist.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Optionales Objekt für benutzerdefinierte Skill-spezifische Konfigurationsfelder.
</ParamField>

## Agenten-Positivlisten (`agents`)

Verwenden Sie die Agentenkonfiguration, wenn Sie dieselben Skill-Stammverzeichnisse
für Maschine und Workspace, aber für jeden Agenten eine andere sichtbare Skill-Menge
verwenden möchten.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // gemeinsame Ausgangsbasis
    },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte vollständig
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Gemeinsame Ausgangs-Positivliste, die von Agenten geerbt wird, die
  `agents.entries.*.skills` weglassen. Lassen Sie sie vollständig weg, damit Skills
  standardmäßig nicht eingeschränkt werden.
</ParamField>

<ParamField path="agents.entries.*.skills" type="string[]">
  Explizite endgültige Skill-Menge für diesen Agenten. Explizite Listen
  **ersetzen** geerbte Standardwerte – sie werden nicht zusammengeführt. Setzen Sie
  sie auf `[]`, um für diesen Agenten keine Skills bereitzustellen.
</ParamField>

<Warning>
  Agenten-Skill-Positivlisten sind ein Sichtbarkeits- und Ladefilter für die
  Skill-Erkennung, Prompts, Slash-Befehlserkennung, Sandbox-Synchronisierung und
  Skill-Snapshots von OpenClaw. Sie stellen keine Autorisierungsgrenze zur
  Shell-Laufzeit dar. Wenn ein Agent den Host-Befehl `exec` ausführen
  kann, kann diese Shell weiterhin externe Clients ausführen oder Host-Dateien lesen,
  die für den ausführenden Benutzer sichtbar sind, einschließlich MCP-Client-
  Registrierungen wie `~/.openclaw/skills/config/mcporter.json`. Kombinieren Sie für eine MCP-Isolierung
  pro Agent Skill-Positivlisten mit Sandbox-/Betriebssystembenutzer-Isolierung,
  verweigern Sie die Host-Ausführung oder beschränken Sie sie auf eine enge
  Positivliste, und bevorzugen Sie agentenspezifische Anmeldedaten am MCP-Server.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Wenn `true` festgelegt ist, kann OpenClaw aus dauerhaften Korrekturen ausstehende Vorschläge erstellen
  und erfolgreiche, umfangreiche abgeschlossene Arbeiten überprüfen, nachdem das System
  inaktiv geworden ist. Dies kann nach geeigneten Durchläufen einen Modellausführung im Hintergrund hinzufügen. Durch Benutzer veranlasste
  Skill-Erstellung und `/learn` funktionieren weiterhin, wenn die Einstellung `false` ist.
</ParamField>

Informationen zu Eignung, Datenschutz, Kosten, ausschließlich für Vorschläge geltenden Berechtigungen
und Fehlerbehebung finden Sie unter [Selbstlernen](/de/tools/self-learning).

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` ermöglicht vom Agenten initiiertes Anwenden, Ablehnen oder Unter-Quarantäne-Stellen ohne eine
  zusätzliche Genehmigungsaufforderung. `pending` erfordert die Genehmigung durch den Betreiber.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Erlaubt Skill Workshop beim Anwenden, über Symlinks von Workspace-Skills zu schreiben, deren
  tatsächliches Ziel bereits durch `skills.load.allowSymlinkTargets` als vertrauenswürdig eingestuft ist. Lassen Sie
  diese Option deaktiviert, sofern das Anwenden generierter Vorschläge diesen gemeinsam genutzten
  Skill-Stamm nicht verändern soll.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maximale Anzahl ausstehender und unter Quarantäne gestellter Vorschläge, die pro Workspace aufbewahrt werden (zulässiger
  Bereich: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maximale Größe des Vorschlagsinhalts in Byte (zulässiger Bereich: 1024-200000). Vorschlagsbeschreibungen
  sind separat fest auf 160 Byte begrenzt, da sie
  in den Ausgaben für Erkennung und Auflistung erscheinen.
</ParamField>

Informationen zum Vorschlagslebenszyklus, zu CLI-Befehlen, Parametern der Agentenwerkzeuge
und Gateway-Methoden, die von dieser Konfiguration gesteuert werden, finden Sie unter [Skill Workshop](/de/tools/skill-workshop).

## Skill-Stammverzeichnisse mit Symlinks

Standardmäßig bilden die Skill-Stammverzeichnisse von Workspace, Projekt-Agent, zusätzlichen Verzeichnissen und gebündelten Skills
Einschlussgrenzen. Ein Skill-Ordner mit Symlink unter `<workspace>/skills`,
der auf ein Ziel außerhalb des Stammverzeichnisses verweist, wird mit einer Protokollmeldung übersprungen.

Um ein beabsichtigtes Symlink-Layout zuzulassen, deklarieren Sie das vertrauenswürdige Ziel:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Mit dieser Konfiguration wird `<workspace>/skills/manager -> ~/Projects/manager/skills`
nach der Auflösung des tatsächlichen Pfads akzeptiert. `extraDirs` durchsucht das benachbarte Repository
direkt; `allowSymlinkTargets` behält den Symlink-Pfad für bestehende
Layouts bei.

Beim Anwenden schreibt Skill Workshop standardmäßig nicht über diese Symlinks. Damit
Workshop beim Anwenden Skills unter bereits vertrauenswürdigen Symlink-Zielen verändern kann, aktivieren
Sie dies separat:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Verwaltete Verzeichnisse vom Typ `~/.openclaw/skills` und persönliche Verzeichnisse vom Typ `~/.agents/skills`
akzeptieren Symlinks für Skill-Verzeichnisse bereits uneingeschränkt (der Einschluss von
`SKILL.md` pro Skill gilt weiterhin) — `allowSymlinkTargets` wird nur
für Workspace-, zusätzliche Verzeichnis- und Projekt-Agent-Stammverzeichnisse (`<workspace>/.agents/skills`)
benötigt.

## Skills in Sandboxes und Umgebungsvariablen

<Warning>
  `skills.entries.<skill>.env` und `apiKey` gelten nur für Ausführungen auf dem **Host**.
  Innerhalb einer Sandbox haben sie keine Wirkung — ein Skill, der von
  `GEMINI_API_KEY` abhängt, schlägt mit `apiKey not configured` fehl, sofern der Sandbox
  die Variable nicht separat übergeben wird.
</Warning>

Übergeben Sie Geheimnisse mit folgender Konfiguration an eine Docker-Sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Benutzer mit Zugriff auf den Docker-Daemon können die Werte von `sandbox.docker.env`
  über Docker-Metadaten einsehen. Verwenden Sie eine eingebundene Geheimnisdatei, ein benutzerdefiniertes Image oder
  einen anderen Übertragungsweg, wenn diese Offenlegung nicht akzeptabel ist.
</Note>

## Erinnerung an die Ladereihenfolge

```text
workspace/skills      (höchste Priorität)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
gebündelte Skills
skills.load.extraDirs (niedrigste Priorität)
```

Änderungen an Skills und Konfiguration werden bei der nächsten neuen Sitzung wirksam, wenn der
Watcher aktiviert ist, oder beim nächsten Agentendurchlauf, wenn der Watcher eine
Änderung erkennt.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Was Skills sind, Ladereihenfolge, Zugriffssteuerung und SKILL.md-Format.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellung benutzerdefinierter Workspace-Skills.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für von Agenten entworfene Skills.
  </Card>
  <Card title="Selbstlernen" href="/de/tools/self-learning" icon="brain">
    Konservative, freiwillig aktivierte Vorschläge aus abgeschlossenen Arbeiten.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Katalog von Slash-Befehlen und Chat-Direktiven.
  </Card>
</CardGroup>
